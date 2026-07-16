export interface PlayerPreferences { ratings:Record<string,number> }
const KEY='blackmamba.player.preferences.v1';
const LEGACY_PROFILE_KEY='pulso.profile.v1';
const LEGACY_RATINGS_KEY='blackmamba-vitrine-ratings';

const parseRatings=(raw:string|null):Record<string,number>=>{try{const value=JSON.parse(raw??'null');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}};

export function loadProfile():PlayerPreferences{
  const current=parseRatings(localStorage.getItem(KEY));
  if(Object.keys(current).length)return{ratings:current};
  try{const legacyProfile=JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY)??'null') as {ratings?:Record<string,number>}|null;if(legacyProfile?.ratings&&Object.keys(legacyProfile.ratings).length)return{ratings:legacyProfile.ratings}}catch{/* ignore corrupt legacy profile */}
  return{ratings:parseRatings(localStorage.getItem(LEGACY_RATINGS_KEY))};
}

export function saveRatings(ratings:Record<string,number>){localStorage.setItem(KEY,JSON.stringify(ratings));return{ratings}}
