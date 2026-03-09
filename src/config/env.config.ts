export function logMissingEnvVars(
  envVars: Record<string, string | undefined>,
  message = "Missing environment variables"
) {
  const missingVars = Object.entries(envVars).filter(([_, value]) => !value);

  if (missingVars.length > 0) {
    const varsToLog = Object.fromEntries(missingVars);
    console.error(varsToLog, message);
    return true;
  }

  return false;
}

const ENV_VARS = {
   BASE_URL: import.meta.env.VITE_API_BASE_URL,
}

logMissingEnvVars(ENV_VARS);

export default ENV_VARS;

