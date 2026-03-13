// Simple test to check content moderation
const testModeration = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/test-moderation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Violence',
        content: 'This is a test with violent content',
        featuredImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // tiny transparent pixel
      })
    });
    
    const result = await response.json();
    console.log('Moderation test result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testModeration();
