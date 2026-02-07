// Simple test for Gemini API
const testGemini = async () => {
  try {
    console.log('Testing Gemini API...')
    
    const response = await fetch('http://localhost:3000/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Generate 1 simple math question: What is 2+2?'
      })
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Success! Response:', data)
    } else {
      const errorData = await response.json()
      console.log('❌ Error:', errorData)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testGemini()
