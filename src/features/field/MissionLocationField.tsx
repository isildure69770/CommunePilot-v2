import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import MapClickSelector from "../map/components/MapClickSelector";

interface Street { name: string; latitude: number; longitude: number }
interface Props { address: string; latitude?: number; longitude?: number; onChange(value:{address:string;latitude?:number;longitude?:number}):void }

export default function MissionLocationField({address,latitude,longitude,onChange}:Props) {
  const [streets,setStreets]=useState<Street[]>([]); const [mapOpen,setMapOpen]=useState(false);
  useEffect(()=>{fetch("/data/montrottier/roads.geojson").then(response=>response.json()).then((data)=>{const byName=new Map<string,Street>();for(const feature of data.features??[]){const name=String(feature.properties?.name??"").trim();const coordinates=feature.geometry?.type==="LineString"?feature.geometry.coordinates:feature.geometry?.type==="MultiLineString"?feature.geometry.coordinates.flat():[];if(!name||!coordinates.length||byName.has(name))continue;const middle=coordinates[Math.floor(coordinates.length/2)];byName.set(name,{name,longitude:Number(middle[0]),latitude:Number(middle[1])});}setStreets([...byName.values()].sort((a,b)=>a.name.localeCompare(b.name,"fr")));}).catch(()=>setStreets([]));},[]);
  const selected=useMemo(()=>streets.find(street=>street.name===address),[address,streets]);
  const chooseAddress=(value:string)=>{const street=streets.find(item=>item.name===value);onChange({address:value,latitude:street?.latitude??latitude,longitude:street?.longitude??longitude});};
  const chooseMap=(nextLatitude:number,nextLongitude:number)=>{const nearest=streets.reduce<Street|undefined>((best,street)=>!best||distance(street,nextLatitude,nextLongitude)<distance(best,nextLatitude,nextLongitude)?street:best,undefined);onChange({address:nearest?.name??`${nextLatitude.toFixed(6)}, ${nextLongitude.toFixed(6)}`,latitude:nextLatitude,longitude:nextLongitude});};
  return <div className="mission-location-field"><label>Adresse à Montrottier<input list="montrottier-streets" value={address} onChange={event=>chooseAddress(event.target.value)} placeholder="Rechercher ou saisir une rue…"/><datalist id="montrottier-streets">{streets.map(street=><option value={street.name} key={street.name}/>)}</datalist></label><button type="button" className="secondary-button" onClick={()=>setMapOpen(value=>!value)}><MapPin/> {mapOpen?"Masquer la carte":"Choisir directement sur la carte"}</button>{selected&&<small>Rue sélectionnée dans le référentiel de Montrottier.</small>}{mapOpen&&<MapClickSelector latitude={latitude??45.7907} longitude={longitude??4.4668} title={address||"Emplacement de la mission"} height={300} onChange={chooseMap}/>}</div>;
}

function distance(street:Street,latitude:number,longitude:number){return (street.latitude-latitude)**2+(street.longitude-longitude)**2;}
