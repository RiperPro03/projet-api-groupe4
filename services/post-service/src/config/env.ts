import "dotenv/config";
 
// Fonction utilitaire : lève une erreur si une variable d'env est manquante
const requiredEnv = (key: string): string => {
    const value = process.env[key];
 
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
 
    return value;
};
 
export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3003),
 
    // Connexion MongoDB (Mongoose)
    mongoUri: requiredEnv("MONGO_URI"),
 
    // Secret JWT partagé avec l'auth-service pour vérifier les tokens
    jwt: {
        accessSecret: requiredEnv("JWT_ACCESS_SECRET"),
    },
};