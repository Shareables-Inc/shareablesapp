import axios from 'axios';

const JIRA_API_URL = 'https://shareablesapp.atlassian.net/rest/api/3/issue'; 
const JIRA_EMAIL = 'deven@shareablesapp.com'; 
const JIRA_API_TOKEN = 'ATATT3xFfGF0gssDK70YFfEw5eTuDHs-DvapyJioDJCCcLAVQpO-2_iSVwQExlh5-q34kmlfSVTJ5f6E8RNfGEAVDLDSmUHcZ2I9_S3hFx4ADIOWsmiWanso-FP7IKqFJsSwf2ctbGpGP0-j5ar51PTqYGQCtiimmbarexMNDqhfGRn-gPauq2U=9BC60415';  

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
          id: "10000"  
        },
        issuetype: {
          id: "10002"  
        },
        reporter: {
          id: "712020:c10d8133-fb88-4543-b1f4-3dda2d72fe73"  
        },
        assignee: {
          id: "712020:202b2f9d-c66a-412c-a2de-0dcd2dc36499"  
        },
        parent: {
          key: "SI-75"
        }
      }
    };
  
    console.log("Sending request to Jira with the following data:", JSON.stringify(issueData, null, 2));
  
    try {
      const response = await axios.post(JIRA_API_URL, issueData, {
        auth: {
          username: JIRA_EMAIL,  
          password: JIRA_API_TOKEN 
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000  
      });
  
      console.log("Jira response:", response.data);  
      return response.data;
    } catch (error) {
      console.log("Error occurred while reporting a bug.");
  
      if ((error as any).response) {
        console.error('Error response from Jira:', (error as any).response.data, 'Status code:', (error as any).response.status);
      } else if ((error as any).request) {
        console.error('No response from Jira:', (error as any).request);
      } else {
        console.error('Error setting up the Jira request:', (error as any).message);
      }
  
      throw error;
    }
  };
  