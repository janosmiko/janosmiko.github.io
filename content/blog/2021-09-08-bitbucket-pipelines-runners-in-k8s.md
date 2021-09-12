---
title: How to run Self Hosted Bitbucket Pipelines Runners in Kubernetes
toc: true
authors:
  - janos-miko
tags:
  - bitbucket
  - pipelines
  - runners
  - kubernetes
categories: tech
date: '2021-09-08'
lastmod: '2021-09-08'
featuredImage: /images/blog/2021-09-08-bitbucket-pipelines-runners-in-k8s/bitbucket-pipelines-runners-in-k8s.png 
featuredImage_webp: /images/blog/2021-09-08-bitbucket-pipelines-runners-in-k8s/bitbucket-pipelines-runners-in-k8s.webp
---

Atlassian [announced](https://bitbucket.org/blog/pipelines-runners) self-hosted Runners for Bitbucket Pipelines, let's try them out. 

<!--more-->

Runners can be configured on 2 levels:

- Workspace level 
- Project level

Let's see how can we create Runners in Workspace level.

## How to create a Runner? 

### Create a new Workspace Runner in Bitbucket

Go to the **Workspace Settings**: click on your **Profile Picture** and **Select the Workspace**.

![1_workspace_settings.png](/images/blog/2021-09-08-bitbucket-pipelines-runners-in-k8s/1_workspace_settings.png)

Click on the **Settings** and Scroll down to **Workspace Runners** and click on **Add Runner**.

![2_workspace_runners.png](/images/blog/2021-09-08-bitbucket-pipelines-runners-in-k8s/2_workspace_runners.png)

Give your runner a **name** and click on **next**.

![3_new_runner.png](/images/blog/2021-09-08-bitbucket-pipelines-runners-in-k8s/3_new_runner.png#300px)

It is going to give you a command output like this:

```plaintext
docker container run -it -v /tmp:/tmp -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
  -e ACCOUNT_UUID={__ACCOUNT_UUID__} \
  -e RUNNER_UUID={__RUNNER_UUID__} \
  -e OAUTH_CLIENT_ID=__OAUTH_CLIENT_ID__ \
  -e OAUTH_CLIENT_SECRET=__OAUTH_CLIENT_SECRET__ \
  -e WORKING_DIRECTORY=/tmp \
  --name runner-7deb7740-f86b-50d0-9c85-671fcb3c9038 \
  docker-public.packages.atlassian.com/sox/atlassian/bitbucket-pipelines-runner:1
```

**Save it** and click on **finish**.

You have to extract the `ACCOUNT_UUID`, the `RUNNER_UUID`, the `OAUTH_CLIENT_ID` and the `OAUTH_CLIENT_SECRET` variables from the command.

Watch out for the following:
- Copy the `ACCOUNT_UUID` and the `RUNNER_UUID` **without** the curly braces.
- Make sure to copy the whole `OAUTH_CLIENT_SECRET` (it may contain special characters like dashes or underscores).
- The `OAUTH` variables have to be converted to base64.

You can fill the following script and later generate the k8s resources using these variables:

```bash
export ACCOUNT_UUID=__ACCOUNT_UUID__
export RUNNER_UUID=__RUNNER_UUID__
export OAUTH_CLIENT_ID=__OAUTH_CLIENT_ID__
export OAUTH_CLIENT_SECRET=__OAUTH_CLIENT_SECRET__

export BASE64_OAUTH_CLIENT_ID=$(echo -n $OAUTH_CLIENT_ID | base64)
export BASE64_OAUTH_CLIENT_SECRET=$(echo -n $OAUTH_CLIENT_SECRET | base64)
```

### Implementation in Kubernetes

Now on the interesting part. Replace the `${VAR_NAME}` placeholders with the contents of those variables.

Important:

- use the base64 encoded versions of the OAUTH variables in the `secret.yaml`
- keep the quotes and braces (", {, }) in the job.yaml lines 17 and 19

The following bash scripts are going to generate the `secret.yaml` and `job.yaml` files in the current working directory.

`secret.yaml:`

```bash
cat > ./secret.yaml <<-EOF
apiVersion: v1
kind: Secret
metadata:
  name: runner-oauth-credentials
  labels:
    accountUuid: ${ACCOUNT_UUID}
    runnerUuid: ${RUNNER_UUID}
data:
  oauthClientId: ${BASE64_OAUTH_CLIENT_ID}
  oauthClientSecret: ${BASE64_OAUTH_CLIENT_SECRET}
EOF
```

`job.yaml:`

```bash
cat > ./job.yaml <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: runner
spec:
  template:
    metadata:
      labels:
        accountUuid: ${ACCOUNT_UUID}
        runnerUuid: ${RUNNER_UUID}
    spec:
      containers:
        - name: bitbucket-k8s-runner
          image: docker-public.packages.atlassian.com/sox/atlassian/bitbucket-pipelines-runner
          env:
            - name: ACCOUNT_UUID
              value: "{${ACCOUNT_UUID}}"
            - name: RUNNER_UUID
              value: "{${RUNNER_UUID}}"
            - name: OAUTH_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: runner-oauth-credentials
                  key: oauthClientId
            - name: OAUTH_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: runner-oauth-credentials
                  key: oauthClientSecret
            - name: WORKING_DIRECTORY
              value: "/tmp"
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: docker-containers
              mountPath: /var/lib/docker/containers
              readOnly: true
            - name: var-run
              mountPath: /var/run
        - name: docker-in-docker
          image: docker:20.10.7-dind
          securityContext:
            privileged: true
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: docker-containers
              mountPath: /var/lib/docker/containers
            - name: var-run
              mountPath: /var/run
      restartPolicy: OnFailure
      volumes:
        - name: tmp
        - name: docker-containers
        - name: var-run
  backoffLimit: 6
  completions: 1
  parallelism: 1
EOF
```

Apply the generated manifests to Kubernetes:

```bash
kubectl create namespace bitbucket-runner --dry-run -o yaml | kubectl apply -f -

kubectl -n bitbucket-runner apply -f secrets.yaml
kubectl -n bitbucket-runner apply -f job.yaml
```

If everything went fine, you will soon see the runner with `ONLINE` status on the Workspace Runners page.

![4_registered_runner.png](/images/blog/2021-09-08-bitbucket-pipelines-runners-in-k8s/4_registered_runner.png)

If you decide to delete the runner from Kubernetes, you run the following steps:

```bash
kubectl -n bitbucket-runner delete -f job.yaml            
kubectl -n bitbucket-runner delete -f secret.yaml 

kubectl delete namespace bitbucket-runner
```


## How to use this runner in a Bitbucket Pipeline?

It's pretty straightforward, add the runner's labels to the pipeline step.

```yaml
pipelines:
  custom:
    pipeline:
      - step:
          name: Step1
          # default: 4gb, 2x: 8GB, 4x: 16GB, 8x: 32gb
          size: 8x 
          runs-on: 
            - 'self.hosted'
            - 'my.custom.label'
          script:
            - echo "This step will run on a self hosted runner with 32 GB of memory.";
      - step:
          name: Step2
          script:
            - echo "This step will run on Atlassian's infrastructure as usual.";
```

## Error: Status 500 in Bitbucket Pipelines

As we wanted to build Docker images (using Docker in Docker or _dind_) in our pipeline we faced the following issue:

```json
Status 500: {"message":"io.containerd.runc.v2: failed to adjust OOM score for shim: set shim OOM score: write /proc/PROC_ID/oom_score_adj: invalid argument\n: exit status 1: unknown"}
```

### How to fix it

First I tried to find root cause of this error message, but I couldn't find anything except some comments about this was already fixed in containerd's latest release, and so on... So I decided to check if the software versions are matching. Even while containerd was matching the required version I found that the Docker on the servers are a bit outdated (19.03) so I decided to update it.

After the upgrade I still saw the previously mentioned error messages in the Bitbucket Pipelines.

I verified Docker version running on the server:

```yaml
# docker --version    
Docker version 20.10.7, build f0df350
```

I replaced docker in docker (_dind_) container image version to use the exact same version as the installed one on our k8s cluster.

```yaml
- name: docker-in-docker
  image: docker:20.10.5-dind  ->  docker:20.10.7-dind
```

And magically the error went away and everything works as expected.

Further reading:

- [https://bitbucket.org/blog/pipelines-runners](https://bitbucket.org/blog/pipelines-runners)
- [https://community.atlassian.com/t5/Bitbucket-Pipelines-articles/Bitbucket-Pipelines-Runners-is-now-in-open-beta/ba-p/1691022](https://community.atlassian.com/t5/Bitbucket-Pipelines-articles/Bitbucket-Pipelines-Runners-is-now-in-open-beta/ba-p/1691022)