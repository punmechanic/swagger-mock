# Swagger Mock

Crap name, code is a bit better, though.

## Vision

```
swagger-mock \
  --specification=./path/to/swagger/spec.yml \
  --host=127.0.0.1 \
  --port=8080
```

Will launch a web host that will respond to API endpoints defined in the Swagger spec. Data will be returned according to the response schema. For example, given the below spec:

```yaml
swagger: "2.0"
paths:
  /:
    responses:
      200:
        type: string
```

We should be able to cURL this path:

```bash
curl localhost:8080/
> ""
```

We can also use custom extension attributes to ask for specific data to be returned ie

```yaml
swagger: "2.0"
paths:
  /:
    responses:
      200:
        type: string
        x-static-value: "Hello, world!"
```

```bash
curl localhost:8080/
> "Hello, world!"
```

Where possible, we should rely on existing hints in the spec for what to return. For example, a schema with the type `string` and `format` `email` should return a random email address.
