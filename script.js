function sendMessage() {
    const text = messageInput.value.trim();
    const mediaFile = mediaInput.files[0];
  
    if (!text && !mediaFile) {
      alert("You can't send an empty message!");
      return;
    }
  
    let mediaData = null;
    if (mediaFile) {
      const reader = new FileReader();
      reader.readAsDataURL(mediaFile);
      reader.onload = () => {
        mediaData = reader.result;
        sendToServer(text || "", mediaData);
      };
    } else {
      sendToServer(text || "", null);
    }
  
    messageInput.value = "";
    mediaInput.value = "";
  }
  
  function displayMessage(message, sender, media, pfp, messageId) {
    if (!message && !media) return;
  
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");
    messageContainer.setAttribute("data-id", messageId);
  
    const avatarElement = document.createElement("img");
    avatarElement.src = pfp || "default-pfp.jpg";
    avatarElement.classList.add("avatar");
  
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-bubble");
    messageElement.textContent = message;
  
    messageContainer.appendChild(avatarElement);
    messageContainer.appendChild(messageElement);
  
    if (media) {
      const mediaElement = document.createElement(media.startsWith("data:image") ? "img" : "video");
      mediaElement.src = media;
      if (mediaElement.tagName === "VIDEO") mediaElement.controls = true;
      mediaElement.classList.add("media");
      messageContainer.appendChild(mediaElement);
    }
  
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  