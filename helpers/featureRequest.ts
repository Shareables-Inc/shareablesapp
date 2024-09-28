import axios from 'axios';
import Constants from 'expo-constants';

const JIRA_API_URL = 'https://your-domain.atlassian.net/rest/api/3/issue';
const JIRA_EMAIL = 'deven@shareablesapp.com';  // Your Jira email
const JIRA_API_TOKEN = Constants.expoConfig?.extra?.jiraApiToken;  // Access the Jira API token from app.json

export const reportBugToJira = async (title: string, description: string) => {
  const issueData = {
    fields: {
      summary: title,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                text: description,
                type: "text"
              }
            ]
          }
        ]
      },
      project: {
        id: "10000"  // Replace with your Jira project ID
      },
      issuetype: {
        id: "10003"  // Replace with your issue type ID (e.g., Bug)
      },
      reporter: {
        id: "712020:c10d8133-fb88-4543-b1f4-3dda2d72fe73"  // Replace with your Jira reporter ID
      },
      assignee: {
        id: "712020:202b2f9d-c66a-412c-a2de-0dcd2dc36499"  // Replace with your Jira assignee ID
      }
    }
  };

  try {
    const response = await axios.post(JIRA_API_URL, issueData, {
      auth: {
        username: JIRA_EMAIL,  // Use your Jira email
        password: JIRA_API_TOKEN  // Use the API token from app.json
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error reporting bug to Jira:', error);
    throw error;
  }
};
