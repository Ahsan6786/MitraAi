
export interface StateData {
    id: string;
    name: string;
    youtubeUrl: string;
    description: string;
}

export const statesData: StateData[] = [
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
