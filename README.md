# API Setup

This is a initializing starting point for making an API.

### Example Model

| Column Name | Data Type | Notes |
| --------------- | ------------- | ------------------------------ |
| id | ObjectId | Made by MongoDB |
| name | String | Optional in this case |
| completed | Boolean | `true` or `false` |
| __v | Number | Made by Mongoose |

### Default Routes

| Method | Path | Location | Purpose |
| ------ | ---------------- | -------------- | ------------------- |
| GET | /v1 | app.js | Welcome to API |
| GET | /v1/examples | example.js | Get all examples |
| GET | /v1/examples/:id | example.js | Get one example |
| POST | /v1/examples | example.js | Create an example |
| PUT | /v1/examples/:id | example.js | Update an example |
| DELETE | /v1/examples/:id | example.js | Delete an example |

## Examples

Detailed info for serialized examples
- Get all examples : GET /examples
- Get one example : GET /examples/:id
- Create a capsule : POST /examples
- Update a capsule : PUT /examples/:id
- Delete a capsule : DELETE /examples/:id
