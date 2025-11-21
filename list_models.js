import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Available Models:');
        const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        generateModels.forEach(model => {
            console.log(`- ${model.name} (${model.displayName})`);
        });
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
