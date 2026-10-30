# PawBridge — responsible pet adoption (Software Engineering project)

A working web app: browser frontend (HTML/CSS/JS) + Python FastAPI backend + SQLite database.
Requests really travel between accounts through the database and show up as notifications.

## Folder structure
```
pawbridge/
├── start.bat / start.sh      one-click run (installs packages, starts server)
├── backend/                  Python API
│   ├── main.py               app entry, serves the website too
│   ├── config.py database.py models.py schemas.py auth.py notify.py serializers.py utils.py
│   ├── seed.py               demo accounts, pets, clinics, products
│   ├── show_db.py            print the database tables in the terminal
│   └── routes/               auth, pets, adoptions, visits, vets, products, cart, orders,
│                             notifications, admin, uploads
├── database/                 pawbridge.db is created here on first run
└── frontend/
    ├── index.html
    ├── css/style.css
    ├── js/                   config, api, ui, components, app (router) + pages/*.js
    └── images/               PUT YOUR PICTURES HERE (see images/README.txt)
```

## Run it
Needs Python 3.10 or newer (python.org). Then:

* Windows: double-click `start.bat`
* Mac/Linux: `./start.sh`

Or manually:
```
cd backend
python -m venv venv
venv\Scripts\activate        (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
uvicorn main:app --reload
```
Open **http://localhost:8000** (do not open index.html by double-click; it needs the server).
API docs: http://localhost:8000/docs

To reset everything: stop the server, delete `database/pawbridge.db`, start again.

## Demo accounts
| Account type | Username | Password |
|---|---|---|
| Moderator | moderator | moderator123 |
| Adopter (individual) | demo | demo12345 |
| Individual owner | ravi | ravi12345 |
| Individual owner | meera | meera12345 |
| Shelter (Happy Tails Shelter) | happytails | shelter12345 |
| Vet clinic (Sunbeam) | sunbeam | vet12345 |
| Vet clinic (Paws & Claws) | pawsclaws | vet12345 |
| Vet clinic (Green Meadow) | greenmeadow | vet12345 |
| Store | store | store12345 |

New users can register as an Individual or a Shelter on the Sign-in page.

## Demo script (works in two browser windows, e.g. normal + private)
1. Window A: sign in as `demo`, open **Kaapi** (shelter pet) -> *Request adoption*.
   Window B: sign in as `happytails` -> bell shows a notification -> Dashboard > Incoming Adoptions -> Chat / Approve.
2. Repeat with **Bruno** (individual owner `ravi`): the notification goes to ravi instead.
3. `demo` -> *Schedule a visit* (date + slot). Owner sees it in Dashboard > Visits and accepts or rejects the slot; `demo` is notified.
4. `demo` -> Find a Vet -> request appointment. Sign in as `sunbeam` to confirm or decline it.
5. `demo` -> Pet Essentials -> open a product -> quantity -> Add to cart -> Checkout (UPI / card / cash on delivery, simulated).
   Sign in as `store` -> Incoming Orders -> Confirm / Ship / Deliver; `demo` is notified at each step.
6. `demo` -> Rehome a Pet -> submit. Sign in as `moderator` -> Moderation -> Approve; the pet appears in the catalogue.
7. Show the database: `moderator` -> Database tab (or run `python show_db.py` in the backend folder, or open
   `database/pawbridge.db` with the free "DB Browser for SQLite").

## Notes
* Payments are simulated. Card numbers are never stored (only the last 4 digits).
* Passwords are stored as salted PBKDF2 hashes. Login uses JWT tokens.
* Clinics, pets and products are demonstration data.
