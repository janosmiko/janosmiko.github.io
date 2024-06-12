---
title: Demystifying Bitbucket Pipelines Memory Limits
toc: true
authors:
  - janos-miko
tags:
  - bitbucket
  - pipelines
  - memory
categories: 
  - tech
date: '2021-09-17'
lastmod: '2021-09-17'
sitemap_exclude: false
featuredImage: /images/blog/2021-09-18-demystifying-bitbucket-pipelines-memory-limits/demystifying-bitbucket-pipelines-memory-limits.jpeg
featuredImage_webp: /images/blog/2021-09-18-demystifying-bitbucket-pipelines-memory-limits/demystifying-bitbucket-pipelines-memory-limits.webp
---

Bitbucket Pipelines memory management can be a headache in complex cases.

And its documentation is confusing.

So let&apos;s figure out through examples how it works.

<!--more-->

## Why are we here?

- `A step does not have the minimum resources needed to run (x MB). Services on the current step are consuming y MB.`

or

- `Service 'docker' exceeded memory limit.`

If you ever faced these error messages, then this article is for you.

## The limitations

In this first part, let's go through the limitations with some detailed explanation. And later take a look at some examples.

- The default max memory in the Bitbucket Cloud Pipeline Steps are 4 GB.
    > But this can be **raised up to 8 GB** using 2x in steps.

- The build container consumes 1 GB.
    > Now you only have 3/7 GB left.

- You can add additional services to the steps and set their memory limits.
    > E.g. You can set up a redis service. In this case this will consume a part of the 8 GB.

- The total memory of services must not exceed the remaining memory.
    > The 8 GB is a limit across the whole step, including build container, services, etc.

- Docker itself is a service as well.
    > If you run `docker build` inside a pipeline step, it will consume memory.

- You can configure all steps' memory requirements on its own.
    > If you want to.

## Examples

### 1. Super simple one-step setup

In this case we will run one single step without any attached service.

`bitbucket-pipelines.yml:`

```yaml
clone:
  enabled: false

pipelines:
  custom:
    build:
      - step:
          name: This is the first step
          image: alpine
          script:
            - echo test
```

The memory reservation table is pretty simple here:

```
------------------------------------
| Service name   | Reserved memory |
|----------------|-----------------|
| Step container |       1 GB      |
|----------------|-----------------|
| SUM            |       1 GB      |
------------------------------------
```

### 2. Attaching a service to the setup

In the next case we attach a Redis service to the step.

`bitbucket-pipelines.yml:`

```yaml
clone:
  enabled: false

definitions:
  services:
    # Define a Redis service with 1 GB memory limit
    redis:
      image: redis
      memory: 1024

pipelines:
  custom:
    build:
      - step:
          name: This is the first step
          image: alpine
          # Pass the Redis service to this step
          services:
            - redis
          # Raise the Step limit from 4 GB to 8 GB if required.
          # size: 2x
          # Download netcat and get info from the Redis Service
          script:
            - apk add -u netcat-openbsd
            - echo info | nc -q 5 -v localhost 6379

```

In this case both the build step and the Redis service will require 1 GB memory.

```
------------------------------------
| Service name   | Reserved memory |
|----------------|-----------------|
| Step container |       1 GB      |
| Redis service  |       1 GB      |
|----------------|-----------------|
| SUM            |       2 GB      |
------------------------------------
```

### 3. Multiple services setup with `docker build`

Now let's add a MySQL service and a Docker service, because we want to build a container.

`bitbucket-pipelines.yml:`

```yaml
clone:
  enabled: false

definitions:
  services:
    # Define the Docker service with 1 GB memory limit
    docker:
      memory: 1024
    # Define a MySQL service with 1 GB memory limit
    mysql:
      image: mysql:5.7
      memory: 1024
      variables:
        MYSQL_DATABASE: 'pipeline'
        MYSQL_USER: 'pipeline'
        MYSQL_PASSWORD: 'pipeline'
        MYSQL_RANDOM_ROOT_PASSWORD: 'yes'
    # Define a Redis service with 1 GB memory limit
    redis:
      image: redis
      memory: 1024

pipelines:
  custom:
    build:
      - step:
          name: This is the first step
          image: alpine
          # Pass the Redis service to this step
          services:
            - docker
            - redis
            - mysql
          # Raise the Step limit from 4 GB to 8 GB if required.
          # size: 2x
          # Download netcat and get info from the Redis Service
          script:
            - apk add -u netcat-openbsd
            - echo info | nc -q 5 -v localhost 6379
            - apk add -u mysql-client
            - mysql -h127.0.0.1 -upipeline -ppipeline -e 'SHOW VARIABLES LIKE "%version%";'
            - echo "FROM alpine" > Dockerfile
            - docker build .
```

Note that this is the limit of 1x size Step.
If we increase the docker memory limit from 1024 to 1025 the pipeline will fail.
In that case enable `size: 2x`.

```
------------------------------------
| Service name   | Reserved memory |
|----------------|-----------------|
| Step container |       1 GB      |
| Docker service |       1 GB      |
| Redis service  |       1 GB      |
| MySQL service  |       1 GB      |
|----------------|-----------------|
| SUM            |       4 GB      |
------------------------------------
```

### 4. Using different Docker services for different steps

Now let's assume the following situation:
- One of our build steps requires 6 GB memory for Docker build and a Redis service with 1 GB memory.
- The other step requires a Redis and a MySQL with 2-2 GB memory

In this case if we configure docker service to reserve 6 GB memory, the second step will not have enough memory to run Redis and MySQL.

How to handle this?

It's pretty simple, because we can define our own custom services. 

> **Watch out:** <br>
  You can only use alphanumeric characters and hyphens in the custom service names.<br>
  If you define a docker service, you will have to add `type: docker` to it.

`bitbucket-pipelines.yml:`

```yaml
clone:
  enabled: false

definitions:
  services:
    # Define the default Docker service with 2 GB memory limit
    docker:
      memory: 2048
    # Define the Docker service which requires 6 GB memory
    docker-6g:
      # You will have to define the service type if it is docker
      type: docker
      memory: 6144
    # Define a MySQL service with 2 GB memory limit
    mysql:
      image: mysql:5.7
      memory: 2048
      variables:
        MYSQL_DATABASE: 'pipeline'
        MYSQL_USER: 'pipeline'
        MYSQL_PASSWORD: 'pipeline'
        MYSQL_RANDOM_ROOT_PASSWORD: 'yes'
    # Define a Redis service with 2 GB memory limit
    redis:
      image: redis
      memory: 2048
    # Define a Redis service with 1 GB memory limit
    redis-1g:
      image: redis
      memory: 1024

pipelines:
  custom:
    build:
      - step:
          name: The step which requires 6 GB memory for Docker
          image: alpine
          # Pass the Docker service with 6 GB and the Redis service with 1 GB to this step
          services:
            - docker-6g
            - redis-1g
          # Raise the Step limit from 4 GB to 8 GB.
          size: 2x
          script:
            - apk add -u netcat-openbsd
            - echo info | nc -q 5 -v localhost 6379
            - echo "FROM alpine" > Dockerfile
            - docker build .
      - step:
          name: The step which requires Redis and MySQL with 2-2 GB memory
          image: alpine
          # Pass the default Docker service with 2 GB and the Redis and MySQL services with 2-2 GB to this step
          services:
            - docker
            - redis
            - mysql
          # Raise the Step limit from 4 GB to 8 GB.
          size: 2x
          # Download netcat and get info from the Redis Service
          script:
            - apk add -u netcat-openbsd
            - echo info | nc -q 5 -v localhost 6379
            - apk add -u mysql-client
            - mysql -h127.0.0.1 -upipeline -ppipeline -e 'SHOW VARIABLES LIKE "%version%";'
            - echo "FROM alpine" > Dockerfile
            - docker build .
```

The memory reservation table looks like this:
```
Step 1.                               Step 2.
------------------------------------  ------------------------------------
| Service name   | Reserved memory |  | Service name   | Reserved memory |
|----------------|-----------------|  |----------------|-----------------|
| Step container |       1 GB      |  | Step container |       1 GB      |
| Docker service |       6 GB      |  | Docker service |       2 GB      |
| Redis service  |       1 GB      |  | Redis service  |       2 GB      |
|                |                 |  | MySQL service  |       2 GB      |
|----------------|-----------------|  |----------------|-----------------|
| SUM            |       8 GB      |  | SUM            |       7 GB      |
------------------------------------  ------------------------------------
```

### +1. Reusable bitbucket steps using YAML anchors

It is not only possible to define services, but you can also define steps or even scripts and reuse them in various situations.

In the following example we are going to rewrite the previous file to use YAML anchors (templates).

* We define 3 scripts (check_redis, check_mysql, build_docker)
* We define 2 steps (and utilize in the previously defined scripts in both)
* Use these 2 steps for multiple pipelines without code duplication.

`bitbucket-pipelines.yml:`

```yaml
clone:
  enabled: false
  
# SCRIPT DEFINITIONS
.check_redis: &check_redis |
  apk add -u netcat-openbsd \
  && echo info | nc -q 5 -v localhost 6379
  
.check_mysql: &check_mysql |
  apk add -u mysql-client \
  && mysql -h127.0.0.1 -upipeline -ppipeline -e 'SHOW VARIABLES LIKE "%version%";'
  
.build_docker: &build_docker |
  echo "FROM alpine" > Dockerfile \
  && docker build .

definitions:
# SERVICE DEFINITIONS
  services:
    # Define the default Docker service with 2 GB memory limit
    docker:
      memory: 2048
    # Define the Docker service which requires 6 GB memory
    docker-6g:
      # You will have to define the service type if it is docker
      type: docker
      memory: 6144
    # Define a MySQL service with 2 GB memory limit
    mysql:
      image: mysql:5.7
      memory: 2048
      variables:
        MYSQL_DATABASE: 'pipeline'
        MYSQL_USER: 'pipeline'
        MYSQL_PASSWORD: 'pipeline'
        MYSQL_RANDOM_ROOT_PASSWORD: 'yes'
    # Define a Redis service with 2 GB memory limit
    redis:
      image: redis
      memory: 2048
    # Define a Redis service with 1 GB memory limit
    redis-1g:
      image: redis
      memory: 1024

# STEP DEFINITIONS
  steps: 
    - step: &checkRedisAndBuild
        name: The step which requires 6 GB memory for Docker
        image: alpine
        # Pass the Docker service with 6 GB and the Redis service with 1 GB to this step
        services:
          - docker-6g
          - redis-1g
        # Raise the Step limit from 4 GB to 8 GB.
        size: 2x
        script:
          - *check_redis
          - *build_docker

    - step: &checkRedisCheckMysqlAndBuild
        name: The step which requires Redis and MySQL with 2-2 GB memory
        image: alpine
        # Pass the default Docker service with 2 GB and the Redis and MySQL services with 2-2 GB to this step
        services:
          - docker
          - redis
          - mysql
        # Raise the Step limit from 4 GB to 8 GB.
        size: 2x
        # Download netcat and get info from the Redis Service
        script:
          - *check_redis
          - *check_mysql
          - *build_docker

pipelines:
  # Custom pipeline which can be triggered run manually
  custom:
    build:
      - step:
          <<: *checkRedisAndBuild
      - step:
          <<: *checkRedisCheckMysqlAndBuild
  # Branch pipelines which will run automatically for any commit to these branches.
  branches:
    develop:
      - step:
          <<: *checkRedisAndBuild
    master:
      - step:
          <<: *checkRedisAndBuild
      - step:
          <<: *checkRedisCheckMysqlAndBuild

```

Further reading:
- [Build, test, and deploy with Pipelines - Databases and service containers](https://support.atlassian.com/bitbucket-cloud/docs/databases-and-service-containers/)
