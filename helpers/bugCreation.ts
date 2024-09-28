import axios from 'axios';
import Constants from 'expo-constants';

const JIRA_API_URL = 'https://shareablesapp.atlassian.net/rest/api/3/issue';  // Correct endpoint
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
                  type: "text",
                  text: description
                }
              ]
            }
          ]
        },
        project: {
          id: "10000"  // Replace with your Jira project ID
        },
        issuetype: {
          id: "10002"  // Replace with your issue type ID (e.g., Bug)
        },
        reporter: {
          id: "712020:c10d8133-fb88-4543-b1f4-3dda2d72fe73"  // Replace with your Jira reporter ID
        },
        assignee: {
          id: "712020:202b2f9d-c66a-412c-a2de-0dcd2dc36499"  // Replace with your Jira assignee ID
        }
      }
    };
  
    console.log("Sending request to Jira with the following data:", JSON.stringify(issueData, null, 2));
  
    try {
      const response = await axios.post(JIRA_API_URL, issueData, {
        auth: {
          username: JIRA_EMAIL,  // Use your Jira email
          password: JIRA_API_TOKEN  // Use the API token from app.json
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000  // Increase timeout
      });
  
      console.log("Jira response:", response.data);  // Log the response from Jira
      return response.data;
    } catch (error) {
      console.log("Error occurred while reporting bug to Jira.");
  
      if (error.response) {
        console.error('Error response from Jira:', error.response.data, 'Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response from Jira:', error.request);
      } else {
        console.error('Error setting up the Jira request:', error.message);
      }
  
      throw error;
    }
  };
  