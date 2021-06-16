# Key manager

## Running prepared scenarios

### Set-all 

`npm run start:all`

### Step-by-step

`npm run start:atomic`

### Env configuration

Environment variables needs to be set in `.env` file.

```
BASE_KEY_PATH=... # absolute path to keys directory
AMOUNT=2500000000 # amount used in the examples
```

You can also run run both scripts providing custom `.env` path by running 

`npm run start:atomic dotenv_config_path=./example-env-file`
