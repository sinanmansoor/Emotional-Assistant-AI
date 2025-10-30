## Running Locally

After downloading the project, follow these steps to run it on your local machine:

### 1. Install Dependencies

Open your terminal in the project's root directory and run:

```bash
npm install
```

### 2. Set Up Your Environment File

The project needs an API key to use Google's Generative AI services.

1.  Find the file named `.env` in the main project folder. If it doesn't exist, create it.
2.  Get your Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Add the following line to your `.env` file, replacing `YOUR_API_KEY_HERE` with your actual key:

```
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

3. Run the Development Server

Now you can start the app:

```bash
npm run dev
```

The app should now be running at `http://localhost:9002`.
