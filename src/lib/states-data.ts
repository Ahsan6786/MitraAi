
export interface StateData {
    id: string;
    name: string;
    youtubeUrl: string;
    description: string;
}

export const statesData: StateData[] = [
    {
        id: 'india',
        name: 'India',
        youtubeUrl: 'https://www.youtube.com/embed/Wcd6r97fOgo',
        description: `The history of India is a tapestry woven with the threads of ancient civilizations, powerful empires, and profound cultural transformations. Spanning millennia, it is a story of diversity, resilience, and intellectual achievement.

**Ancient Origins (c. 3300 BCE – 500 CE)**

The story begins with the Indus Valley Civilization, one of the world's first urban cultures, flourishing in the basins of the Indus River. Cities like Mohenjo-daro and Harappa were marvels of urban planning, with sophisticated drainage systems and impressive architecture.

Following its decline, the Vedic Period began with the composition of the Vedas, the foundational texts of Hinduism. This era laid the groundwork for India's social and religious structures. Great empires later rose, including the Mauryan Empire under Ashoka, who famously embraced Buddhism and promoted a message of peace, and the Gupta Empire, often called India's "Golden Age" for its remarkable contributions to mathematics (the concept of zero), astronomy, science, and art.

**The Medieval Era (c. 500 – 1500 CE)**

The medieval period was characterized by a mosaic of regional kingdoms. It saw the rise of powerful southern dynasties like the Cholas, who were masters of maritime trade and built magnificent temples. This era also marked the arrival of Islam in India, leading to the establishment of the Delhi Sultanate, which ruled over large parts of the subcontinent for centuries. This period fostered a unique synthesis of Indian and Islamic cultures, evident in art, music, and architecture.

**The Mughal Empire and European Arrival (c. 1500 – 1857 CE)**

In the 16th century, the Mughal Empire was established, unifying most of the Indian subcontinent. Under emperors like Akbar, Shah Jahan, and Aurangzeb, India witnessed another golden age of art, culture, and architecture, culminating in the creation of the iconic Taj Mahal.

During this time, European traders—the Portuguese, Dutch, French, and British—began to establish coastal trading posts. Over time, the British East India Company's influence grew, gradually eclipsing Mughal power.

**The British Raj and the Fight for Freedom (1857 – 1947 CE)**

Following the Indian Rebellion of 1857, the British Crown took direct control of India, marking the beginning of the British Raj. While this period brought modernization in infrastructure and administration, it was also a time of economic exploitation and suppression of Indian aspirations.

The late 19th and early 20th centuries saw the rise of the Indian independence movement. Led by visionary leaders like Mahatma Gandhi, who championed the principles of non-violent civil disobedience (Satyagraha), millions of Indians united in the struggle for freedom.

**Modern India (1947 CE – Present)**

On August 15, 1947, India finally achieved independence, but it was accompanied by the painful Partition of the subcontinent. Jawaharlal Nehru became the first Prime Minister, and India was established as a sovereign, secular, and democratic republic.

Today, India stands as the world's largest democracy, a nation of over a billion people with a vibrant, diverse culture, a fast-growing economy, and a rich historical legacy that continues to shape its path forward.
        `
    },
    {
        id: 'jammu-and-kashmir',
        name: 'Jammu and Kashmir',
        youtubeUrl: 'https://www.youtube.com/embed/-4cQSUJsLOM',
        description: `Often referred to as "Paradise on Earth," Jammu and Kashmir is renowned for its breathtaking natural beauty, from the snow-capped Himalayan mountains to the serene Dal Lake.
        
Cultural Highlights:
- **Cuisine**: Known for its rich, aromatic dishes. Wazwan, a multi-course meal, is a centerpiece of Kashmiri cuisine, featuring dishes like Rogan Josh and Gushtaba.
- **Handicrafts**: The region is famous for its intricate Pashmina shawls, hand-knotted carpets, and walnut wood carvings.
- **Music and Dance**: Traditional music is Sufiana Kalam, accompanied by instruments like the Santoor and Sitar. The Rouf is a popular folk dance performed by women.
- **Festivals**: Major festivals include Eid, Hemis festival in Ladakh, and the Tulip Festival in Srinagar, which showcases Asia's largest tulip garden.
        `
    }
    // Add more states here as you collect the data
];

export const allIndianStates = [
    { id: 'india', name: 'India' },
    { id: 'andhra-pradesh', name: 'Andhra Pradesh' },
    { id: 'arunachal-pradesh', name: 'Arunachal Pradesh' },
    { id: 'assam', name: 'Assam' },
    { id: 'bihar', name: 'Bihar' },
    { id: 'chhattisgarh', name: 'Chhattisgarh' },
    { id: 'goa', name: 'Goa' },
    { id: 'gujarat', name: 'Gujarat' },
    { id: 'haryana', name: 'Haryana' },
    { id: 'himachal-pradesh', name: 'Himachal Pradesh' },
    { id: 'jammu-and-kashmir', name: 'Jammu and Kashmir' },
    { id: 'jharkhand', name: 'Jharkhand' },
    { id: 'karnataka', name: 'Karnataka' },
    { id: 'kerala', name: 'Kerala' },
    { id: 'madhya-pradesh', name: 'Madhya Pradesh' },
    { id: 'maharashtra', name: 'Maharashtra' },
    { id: 'manipur', name: 'Manipur' },
    { id: 'meghalaya', name: 'Meghalaya' },
    { id: 'mizoram', name: 'Mizoram' },
    { id: 'nagaland', name: 'Nagaland' },
    { id: 'odisha', name: 'Odisha' },
    { id: 'punjab', name: 'Punjab' },
    { id: 'rajasthan', name: 'Rajasthan' },
    { id: 'sikkim', name: 'Sikkim' },
    { id: 'tamil-nadu', name: 'Tamil Nadu' },
    { id: 'telangana', name: 'Telangana' },
    { id: 'tripura', name: 'Tripura' },
    { id: 'uttar-pradesh', name: 'Uttar Pradesh' },
    { id: 'uttarakhand', name: 'Uttarakhand' },
    { id: 'west-bengal', name: 'West Bengal' },
];
