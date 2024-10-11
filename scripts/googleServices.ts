import * as fs from 'fs';
import * as path from 'path';

const environment = process.env.NODE_ENV || 'development';

// Set file paths based on environment
const files = {
  ios: {
    production: './GoogleService-Info.plist',
    development: './GoogleService-Info-Dev.plist',
  },
  android: {
    production: './google-services.json',
    development: './google-services-dev.json',
  },
};

const copyFile = (src: string, dest: string) => {
  try {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } catch (error) {
    console.error(`Failed to copy ${src} to ${dest}:`, error);
    process.exit(1);
  }
};

try {
  // Copy iOS GoogleService-Info.plist
  copyFile(
    files.ios[environment as 'development' | 'production'],
    path.join(__dirname, '../ios/GoogleService-Info.plist')
  );

  // Copy Android google-services.json
  copyFile(
    files.android[environment as 'development' | 'production'],
    path.join(__dirname, '../android/app/google-services.json')
  );

  console.log(`Firebase configuration files for ${environment} have been successfully copied.`);
} catch (error) {
  console.error(`Failed to copy Firebase configuration files: ${error}`);
  process.exit(1);
}
