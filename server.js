require("dotenv").config()

const app = require("./src/app")
const runMigrations = require("./src/db/migrations")

runMigrations()

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})