import { MyApp } from './MyApp.js';

// Create the application object
const app = new MyApp();

// Initialize the application
app.init();

// Start the main animation loop - calls every 50-60 ms.
app.render();
