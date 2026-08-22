const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export async function sendChatMessage({
  message,
  conversation = [],
  childId = null,
}) {
  console.log("=== sendChatMessage called ===");
  console.log({ message, conversation, childId });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Get JWT token
    const token =
      localStorage.getItem("child_safety_token") ||
      sessionStorage.getItem("child_safety_token");

    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    console.log("Making request to:", `${BASE_URL}/chat`);
    console.log("Token exists:", !!token);
    console.log("Base URL:", BASE_URL);

    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        conversation,
        childId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `Server error ${response.status}`;

      try {
        const errJson = await response.json();
        detail = errJson.message || errJson.error || detail;
      } catch {
        // Ignore JSON parsing errors
      }

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error(
          "Access denied. This feature is only available for verified parents."
        );
      }

      if (response.status === 429) {
        throw new Error(
          detail || "Rate limit exceeded. Please try again later."
        );
      }

      throw new Error(detail);
    }

    // Parse backend response
    const data = await response.json();

    console.log("Backend Response:", data);
    console.log("AI Reply:", data?.data?.reply);

    // Return the actual AI reply
    return data?.data?.reply ?? "";
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}