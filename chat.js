function displayMessage(message, sender, media, pfp, messageId) {
    if (!message) return; // Avoid undefined or empty messages
  
    const messageContainer = document.createElement('div');
    const messageElement = document.createElement('div');
    const nameElement = document.createElement('span');
    const avatarElement = document.createElement('img');
  
    nameElement.textContent = sender + ': ';
    nameElement.style.fontWeight = "bold";
    nameElement.style.marginRight = "5px";
  
    messageElement.textContent = message;
    messageContainer.classList.add('message-container');
    messageContainer.setAttribute('data-id', messageId);
  
    avatarElement.src = pfp || 'default-pfp.jpg';
    avatarElement.classList.add('avatar');
  
    messageElement.classList.add('message-bubble');
    messageContainer.appendChild(avatarElement);
    messageContainer.appendChild(messageElement);
  
    // Handle media
    if (media) {
      const mediaElement = document.createElement(media.startsWith('data:image') ? 'img' : 'video');
      mediaElement.src = media;
      if (mediaElement.tagName === 'VIDEO') mediaElement.controls = true;
      mediaElement.classList.add('media');
      messageContainer.appendChild(mediaElement);
    }
  
    messagesDiv.appendChild(messageContainer);
    // Auto-scroll to the latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  