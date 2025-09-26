// Test script to debug the findOverlap endpoint
import fs from 'fs';

const testCoordinates = [
  { X: "2.123", Y: "6.456", Bornes: "P1" },
  { X: "2.124", Y: "6.457", Bornes: "P2" },
  { X: "2.125", Y: "6.458", Bornes: "P3" },
  { X: "2.123", Y: "6.456", Bornes: "P1" } // Closing the polygon
];

async function testFindOverlap() {
  try {
    console.log('🧪 Testing findOverlap endpoint...');
    console.log('🧪 Payload:', JSON.stringify(testCoordinates, null, 2));

    const response = await fetch('http://localhost:3000/api/findOverlap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCoordinates),
    });

    console.log('🧪 Response status:', response.status);
    console.log('🧪 Response ok:', response.ok);

    if (response.ok) {
      const result = await response.json();
      console.log('🧪 Response structure:');
      console.log('🧪 - Type:', Array.isArray(result) ? 'array' : typeof result);
      console.log('🧪 - Keys:', typeof result === 'object' ? Object.keys(result) : 'N/A');
      console.log('🧪 - overlaps length:', result.overlaps ? result.overlaps.length : 'N/A');
      console.log('🧪 - yesNoData keys:', result.yesNoData ? Object.keys(result.yesNoData) : 'N/A');
      console.log('🧪 Full response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('🧪 Error response:', errorText);
    }
  } catch (error) {
    console.error('🧪 Test failed:', error);
  }
}

// Run the test
testFindOverlap();