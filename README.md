# **🤖** Tech Ecommerce API 

# **📜** Overview

This **tech ecommerce API** is designed to manage ecommerce processes efficiently, including:

- 📦 Adding products to a favorites list for later viewing.
- 🛒 Managing customer carts with items details, quantities, and prices.
- 🛍️ Creating orders based on cart items and processing payments with Stripe.
- 💵 Handling payment intents and returning the client secret for secure payments
- Using a webhook end point to monitor stripe events, validate its signature and ensure secure payment processing

---

# ✨ Key Features

## 🔐 Authentication & Authorization

This project use JWT with `passport` defining a JWT strategy to verify token signature and payload content and a local strategy which work with user credentials to verify it and returns a access token if all is fine.

I work with a `@Auth` which receive a role and compare this role with the user, if this is a match so the user can continue if not

### ✉️ Email Notifications

Dynamic email content using **Handlebars (HBS)** templates.

### 🔐 Security & Performance

- Enhanced security with **Helmet**.
- **Rate Limiting** using Throttle.

### ☁️ Cloudinary Integration

Manage image uploads seamlessly.

---

# **🚀** Installation & Setup

1. Clone the Repository:

    ```powershell
    git clone https://github.com/marvnramos/nerdery-rest-api.git
    cd nerdery-rest-api
    ```

2. Install Dependencies:

    ```powershell
    npm install
    ```

3. Set Environment Variables:
    - Copy the `.env.example` file and rename it to `.env`.
    - Fill in the actual values for the environment variables.
    - Any issues with environment variables will be shown in the terminal due to schema validation.
4. Seed the Database:

    ```powershell
    npm run seed
    ```

5. Start the Development Server:

    ```powershell
    # development
    $ npm run start
    
    # watch mode
    $ npm run start:dev
    
    # production mode
    $ npm run start:prod
    ```