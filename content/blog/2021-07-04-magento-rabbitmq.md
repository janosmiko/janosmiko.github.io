---
title: How to test if Magento RabbitMQ Consumers are working properly
toc: true
authors:
  - janos-miko
tags:
  - magento
  - rabbitmq
categories: tech
date: '2021-07-04'
lastmod: '2021-07-04'
featuredImage: /images/blog/2021-07-04-magento-rabbitmq/magento-rabbitmq.png
---

How can you verify if Magento can reach and utilize the benefits of RabbitMQ?

This tutorial will help you to modify attributes of a product using Magento's async API and bulk API.

<!--more-->

## Magento settings

We used the following settings in `app/etc/env.php`.

```php
//...
'queue' => [
        'consumers_wait_for_messages' => 0,
        'amqp' => [
            'host' => 'localhost',
            'port' => '5672',
            'user' => 'magento',
            'password' => 'my-secret',
            'virtualhost' => '/',
            'ssl' => ''
        ]
    ],
    'cron_consumers_runner' => [
        'cron_run' => true,
        'max_messages' => 10000,
        'consumers' => [

        ]
    ],
//...
```

The `consumers_wait_for_messages` setting will command Magento to run the AMQP consumer's in every minute alongside with the default Magento Cron, but the consumer's will instantly stop after they finished consuming all messages. You can read more about this setting here: [Magento DevDocs - Configure consumer behavior](https://devdocs.magento.com/guides/v2.4/install-gde/install/cli/install-cli-subcommands-consumers.html).

## Before we begin

### Create a test product

On the Magento Admin create a test product.

- Catalog → Products → New Product
- Fill the required attributes.
- Click on Save.

For our test product we set the product's SKU to `test`.

### Get your Admin token

- Open the Magento Swagger UI. The URL should be something similar to this.
  - `https://my-magento-shop.com/swagger`
- Authenticate using **twoFactorAuthGoogleAuthenticateV1** endpoint.
- Save the Bearer token.

---

## 1 - Rename the product using Magento's async API

Based on **catalogProductRepositoryV1** endpoint insert the `/async` path before `/V1` in the API call.

**The new API endpoint**

```bash
https://my-magento-shop.com/rest/all/async/V1/products/{SKU}
```

**Example JSON Payload**

```json
{
  "product": {
    "sku": "test",
    "name": "test-11:39:15"
  }
}
```

**Example cURL call (with added `/async` path)**

```bash
curl -X PUT \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer __MY_BEARER_TOKEN__" \
  -d "{ \"product\": { \"sku\": \"test\", \"name\": \"test-11:39:15\" }}" \
  "https://my-magento-shop.com/rest/all/async/V1/products/test"
```

**Post the request using Paw or Postman**

![Rename - Post request with Paw or Postman](/images/blog/2021-07-04-magento-rabbitmq/1-1-rename-post-with-paw.png)

**You can verify if the message arrived to the queue using RabbitMQ Admin (in the Queues section)**

![Rename - Check the queue status in RabbitMQ Admin](/images/blog/2021-07-04-magento-rabbitmq/1-2-rename-rabbitmq-queues.png)

---

## 2 - Rename multiple products using async Bulk API

Based on catalogProductRepositoryV1 add `/async/bulk` path before `/V1` in the API call.

API Endpoint (note: we are not using SKUs in this URL)

```bash
https://my-magento-shop.com/rest/all/async/bulk/V1/products
```

Example JSON Payload:

```json
[
{
  "product": {
    "sku": "test",
    "name": "test-11:44:44"
  }
},
{
  "product": {
    "sku": "16-test1",
    "name": "16-test1-11:44:44"
  }
}
]
```

Example cURL call (with added `/async` path)

```bash
curl -X PUT \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer __MY_BEARER_TOKEN__" \
  -d "[{ \"product\": { \"sku\": \"test\", \"name\": \"test-11:44:44\" }},{ \"product\": { \"sku\": \"16-test1\", \"name\": \"16-test1-11:44:44\" }}]" \
  "https://my-magento-shop.com/rest/all/async/bulk/V1/products"
```

**Post the request using Paw or Postman**

![Mass Rename - Post request with Paw or Postman](/images/blog/2021-07-04-magento-rabbitmq/2-1-mass-rename-post-with-paw.png)

**Response (it is important because it contains the Bulk UUID)**

![Mass Rename - Post response in Paw](/images/blog/2021-07-04-magento-rabbitmq/2-2-mass-rename-response-bulk-uuid.png)

**Check the update in RabbitMQ Admin (Queues)**

![Mass Rename - Check the queue status in RabbitMQ Admin](/images/blog/2021-07-04-magento-rabbitmq/2-3-mass-rename-rabbitmq-queues.png)

**Alternatively you can view the messages in the RabbitMQ Admin (Queues → Get messages)**

![Mass Rename - Check the messages in RabbitMQ admin](/images/blog/2021-07-04-magento-rabbitmq/2-4-mass-rename-messages-in-the-queue.png)

---

## 3 - Check the Bulk update status using Magento API

We will use the BulkUuid from our previous request's response:

```bash
730538f2-92cf-443e-ba07-403f63e9d16b
```

Using Magento /V1/bulk/{bulkUuid}/status endpoint

**Example cURL call**

```bash
curl -X GET \
  -H "accept: application/json" \
  -H "Authorization: Bearer __MY_BEARER_TOKEN__" \
  "https://my-magento-shop.com/rest/all/V1/bulk/730538f2-92cf-443e-ba07-403f63e9d16b/status"
```

**Response**

![Post and Response](/images/blog/2021-07-04-magento-rabbitmq/3-1-post-response.png)

### Check the status on the Magento Admin Dashboard**

Go to **System** → **Action Logs** → **Bulk Actions**

![Magento Admin Bulk Action Log](/images/blog/2021-07-04-magento-rabbitmq/3-2-magento-admin-bulk-action-log.png)

Select the action and click on **Details.**

![Magento Admin Bulk Action Details](/images/blog/2021-07-04-magento-rabbitmq/3-3-magento-admin-action-details.png)
