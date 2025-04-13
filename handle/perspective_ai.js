import axios from "axios";

const PERSPECTIVE_API_KEY = "AIzaSyBG-VGZzGPrNUvf1X9bgSD2W2Hln9qWBBg";

/**
 * Function to analyze content using Perspective API
 * @param {string} content - The content to analyze
 * @returns {Promise<boolean>} - Returns true if the content is sensitive, false otherwise
 */
const moderateContent = async (content) => {
  try {
    const response = await axios.post(
      "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze",
      {
        comment: { text: content },
        languages: ["en"], // Specify the language of the content
        requestedAttributes: {
          TOXICITY: {}, // Check for toxicity
          SEVERE_TOXICITY: {}, // Check for severe toxicity
          INSULT: {}, // Check for insults
          PROFANITY: {}, // Check for profanity
          THREAT: {}, // Check for threats
        },
      },
      {
        params: { key: PERSPECTIVE_API_KEY },
      }
    );

    // Customize thresholds for what is deemed unacceptable
    const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
    const severeToxicityScore = response.data.attributeScores.SEVERE_TOXICITY.summaryScore.value;
    const insultScore = response.data.attributeScores.INSULT.summaryScore.value;
    const profanityScore = response.data.attributeScores.PROFANITY.summaryScore.value;
    const threatScore = response.data.attributeScores.THREAT.summaryScore.value;

    // Define thresholds for unacceptable content
    const isUnacceptable =
      toxicityScore > 0.7 ||
      severeToxicityScore > 0.6 ||
      insultScore > 0.6 ||
      profanityScore > 0.5 ||
      threatScore > 0.5;

    return isUnacceptable;
  } catch (error) {
    console.error("Error analyzing content with Perspective API:", error);
    return false; // Assume content is not sensitive if the API fails
  }
};

export { moderateContent };