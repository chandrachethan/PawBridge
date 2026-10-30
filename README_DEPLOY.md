# PawBridge — deployment package

This package keeps the original HTML/CSS/JavaScript frontend and FastAPI backend, with a Dockerfile and persistent-storage support for deployment.

## Before you deploy

- Do not upload `.env` files, your local `venv`, `__pycache__`, or your local SQLite database.
- This project uses SQLite. Attach a persistent volume at `/data` on Railway so database records and user-uploaded pet photos survive restarts and redeploys.
- This is a student demonstration app. Payments are simulated; do not enter real card or UPI details. Do not use real personal information.
- The production container requires a strong `PAWBRIDGE_SECRET` and private passwords for its seeded demo accounts. Keep these values in Railway Variables only; never put them in GitHub or this ZIP.

## Deploy on Railway (recommended for this SQLite version)

1. Extract this ZIP. The extracted folder should show `Dockerfile`, `backend/`, `frontend/`, and `README_DEPLOY.md` at its top level.
2. Create a GitHub repository and upload the *contents* of this folder (not the ZIP itself). Keep the repository private if your course permits it.
3. Sign in to Railway, choose **New Project → Deploy from GitHub Repo**, and select the repository. Railway should detect the Dockerfile and build the app.
4. In the Railway service, open **Settings / Volumes** (or the Volumes area) and create/attach a volume with mount path exactly `/data`.
5. Open **Variables** and add the variables below before the first successful start. Use unique random passwords, preferably 16+ characters. Save them privately so you can demonstrate each role.
6. Redeploy if Railway does not deploy automatically after saving variables/volume.
7. Open **Settings → Networking → Generate Domain** to create the public website URL.
8. Test the URL and `/api/health`. The health endpoint should return `{"status":"ok"}`.

### Railway Variables to add

| Variable | Value |
|---|---|
| `PAWBRIDGE_SECRET` | Random secret at least 32 characters; keep private |
| `PAWBRIDGE_PASSWORD_MODERATOR` | Private password for username `moderator` |
| `PAWBRIDGE_PASSWORD_DEMO` | Private password for username `demo` |
| `PAWBRIDGE_PASSWORD_RAVI` | Private password for username `ravi` |
| `PAWBRIDGE_PASSWORD_MEERA` | Private password for username `meera` |
| `PAWBRIDGE_PASSWORD_HAPPYTAILS` | Private password for username `happytails` |
| `PAWBRIDGE_PASSWORD_SUNBEAM` | Private password for username `sunbeam` |
| `PAWBRIDGE_PASSWORD_PAWSCLAWS` | Private password for username `pawsclaws` |
| `PAWBRIDGE_PASSWORD_GREENMEADOW` | Private password for username `greenmeadow` |
| `PAWBRIDGE_PASSWORD_STORE` | Private password for username `store` |

The app reads the Railway volume mount path from `/data`, stores `pawbridge.db` there, and stores uploaded photos in `/data/uploads`. It seeds the sample data the first time it starts with an empty database. If the database already contains users, the seed step does not reset their passwords.

## Local run on Windows

Use Python 3.12 (the same minor version used by the included Docker image). Python 3.15 may not have prebuilt wheels for every optional package yet.

1. Install Python 3.12 from https://www.python.org/downloads/release/python-31210/ and enable **Add python.exe to PATH**.
2. Close and reopen File Explorer/Command Prompt so PATH changes are applied.
3. Double-click `start.bat`. It creates or recreates `backend/venv` using Python 3.12, installs dependencies, and starts the server.
4. Open `http://localhost:8000`.

The requirements use plain `uvicorn` rather than `uvicorn[standard]`; the optional standard extra pulls in PyYAML, whose native extension may need a C++ compiler on newer Python versions. PawBridge does not need that optional extra to run.

## Local run on macOS/Linux

Use Python 3.12, then run `./start.sh` from the project folder. Open `http://localhost:8000`.

## Notes

- The frontend calls `/api/...` on the same host, so the deployed frontend and backend stay together in one FastAPI service.
- Do not deploy this version as a static-only site (for example, GitHub Pages): its API and SQLite database require a running Python server.
- Railway's trial and paid-plan details can change. Check current pricing before committing to a paid plan.
