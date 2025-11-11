<div align="center">
    <a href="https://8848digital.com">
        <img src="https://cms-production.8848digital.com///files/8848_Logo.svg?w=256&q=75" height="128">
    </a>
    <h1>EMR Catalog Admin Panel</h1>
    <p><strong>Node.js based Admin Panel for managing EMR Catalog configurations</strong></p>
</div>

---

## 📋 Prerequisites

- **Node.js**
- **npm**
- **Database (SQL Server)**
- **Git** for version control

## 🚀 Installation

### Clone the Repository

```bash
git clone https://github.com/8848digital/EMR_Catalog_Admin_Panel.git
cd EMR_Catalog_Admin_Panel
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

### Development Mode

```bash
npm run dev
```

### Base URL

```
http://localhost:3000/api/
```

## 📁 Project Structure

````
EMR_CATALOG_ADMIN_PANEL/
├── config/                  # Configuration files
│   └── db.js
│
├── controllers/             # Business logic and request handlers
│   ├── authController.js
│   └── custMstController.js
│
├── public/                  # Static assets (CSS, JS)
│   ├── css/
│   └── js/
│
├── routes/                  # Route definitions
│   ├── pageRoute.js
│   └── route.js
│
├── templates/               # EJS view templates
│   ├── config.ejs
│   └── login.ejs
│
├── utils/                   # Helper functions and query handlers
│   ├── controllerWrapper.js
│   └── queryHandler.js
│
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── app.js                   # Main server entry point
├── package.json             # Dependencies and scripts
├── package-lock.json        # Dependency lock file
└── README.md                # Project documentation
```
````
