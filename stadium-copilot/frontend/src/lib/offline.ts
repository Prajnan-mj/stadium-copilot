// Client-side keyword retrieval for Dead-Zone Mode
// Answers from cached venue KB without any network calls

const KB: Record<string, string[]> = {
  bag: [
    'Clear bags up to 12"×6"×12" or a small clutch no larger than 4.5"×6.5". One clear bag per person.',
  ],
  prohibited: [
    'Prohibited: outside food/drink, glass containers, cans, large umbrellas, selfie sticks, professional cameras with detachable lenses, drones, fireworks, weapons.',
  ],
  reentry: [
    'No re-entry once you exit the stadium.',
  ],
  transit: [
    'NJY: NJ Transit Meadowlands Rail from Secaucus Junction (~8 min) — recommended. Miami: Official FIFA match-day shuttle from Aventura Mall hub.',
  ],
  train: [
    'NJ Transit Meadowlands Rail from Secaucus Junction runs on match days. ~8 minutes to the stadium.',
  ],
  shuttle: [
    'Official FIFA match-day shuttles run from Aventura Mall transit hub and designated park-and-ride lots.',
  ],
  water: [
    'Free hydration and water refill stations are at all four concourse corners (NE, NW, SE, SW).',
  ],
  hydration: [
    'Hydration stations with free cold water are on the NE, NW, SE, and SW concourses.',
  ],
  'first aid': [
    'First Aid stations are on the North and South concourses. Alert the nearest yellow-vest steward for emergencies.',
  ],
  help: [
    'Fan Help Desks are on the NE and SW concourses. Staff in yellow vests can assist throughout.',
  ],
  restroom: [
    'Restrooms are on all four concourses. Accessible restrooms with elevator access are on the NE and SW concourses.',
  ],
  accessible: [
    'Accessible restrooms are on the NE and SW concourses. Elevators are at all four corners (NE, NW, SE, SW).',
  ],
  elevator: [
    'Elevators are located at the NE, NW, SE, and SW corners of the stadium.',
  ],
  smoking: [
    'Smoking and vaping are prohibited inside the stadium and on all stadium grounds.',
  ],
  emergency: [
    'Alert the nearest steward in a yellow vest immediately. Emergency assistance is posted at every Fan Help Desk.',
  ],
  heat: [
    'Miami: heat index can exceed 40°C. Drink water every 20 minutes. Free hydration stations on all concourses. Cooling misting zone at Gate C plaza.',
  ],
  parking: [
    'Pre-purchased passes required. Rail or shuttle is strongly recommended over parking.',
  ],
}

export function offlineAnswer(query: string): string {
  const q = query.toLowerCase()
  for (const [keyword, answers] of Object.entries(KB)) {
    if (q.includes(keyword)) {
      return answers[0]
    }
  }
  return 'I\'m in offline mode with cached venue info only. For full assistance, please visit the Fan Help Desk on the NE or SW concourse.'
}
