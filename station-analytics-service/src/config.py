import os
import dotenv

# Load environment variables
env = os.environ.get("ENV", "prod")
if env == "dev":
    dotenv_path = ".env.dev"
else:
    dotenv_path = ".env"
dotenv.load_dotenv(dotenv_path=dotenv_path)
PORT = os.environ["PORT"]
WEB_DOMAIN = os.environ["WEB_DOMAIN"]
AUTH_API_ENDPOINT = os.environ["AUTH_API_ENDPOINT"]