# MST Studios Backend

This is the Node.js/Express backend for the MST Studios Price Calculator. It handles specific pricing logic, sends email notifications upon submission, and manages data via a PostgreSQL database (optional).

## Features

*   **Dynamic Price Calculation**: Validates and calculates prices on the server (Step 1-3 logic).
*   **Email Notifications**: Sends an email to the site owner with full submission details.
*   **Database Storage**: Logs all submissions to a PostgreSQL database (if connected).
*   **Cookie Consent API**: Basic endpoint for logging consent status.

## Deployment on Render (Recommended)

1.  **Push to GitHub**: ensure this `backend` folder is pushed to your GitHub repository.
2.  **Create Web Service**:
    *   Go to [Render.com Dashboard](https://dashboard.render.com/).
    *   Click "New +", select "Web Service".
    *   Connect your GitHub repository.
    *   **Root Directory**: `backend` (Important! Since the backend is in a subfolder).
    *   **Runtime**: Node.js.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `npm start`.
3.  **Environment Variables**:
    *   Add the following in the Render "Environment" tab:
        *   `EMAIL_USER`: Your Gmail address (e.g., `contact@mststudios.com`).
        *   `EMAIL_PASS`: Your Gmail App Password (NOT your login password. Generate one at [Google Account > Security > App Passwords](https://myaccount.google.com/apppasswords)).
        *   `EMAIL_RECEIVER`: The email to receive notifications (defaults to `EMAIL_USER` if unused).
        *   `EMAIL_SERVICE`: `gmail` (default) or `sendgrid` etc.
4.  **Database (Optional)**:
    *   Create a "PostgreSQL" instance on Render.
    *   Copy the `Internal Database URL`.
    *   Add it as `DATABASE_URL` in your Web Service environment variables.

## Integration with Frontend

To connect your React frontend (Hostinger) to this backend (Render):

1.  **Update `PriceCalculator.tsx`**:
    *   Locate the `handleSend` function.
    *   Replace the simulation logic with a real fetch call:

```javascript
const handleSend = async () => {
    // ... setup logic ...
    
    try {
        const response = await fetch('YOUR_RENDER_BACKEND_URL/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                message,
                selections
            })
        });
        
        if (response.ok) {
            setCurrentStep(4); // Success popup
        } else {
            alert("Fejl ved afsendelse.");
        }
    } catch (e) {
        console.error(e);
        alert("Fejl ved afsendelse.");
    }
    // ...
};
```

2.  **Update `CookieBanner.tsx`**:
    *   Uncomment the fetch logic and point it to `YOUR_RENDER_BACKEND_URL/cookie-consent`.

## Local Development

1.  Navigate to `backend`: `cd backend`
2.  Install dependencies: `npm install`
3.  Create a `.env` file with `EMAIL_USER` and `EMAIL_PASS`.
4.  Start server: `npm run dev`
