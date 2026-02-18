// // components/Selects.tsx
// import React, { useState } from 'react';
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Asegúrate de que la ruta sea correcta

// const SelectEstadosVenezuela: React.FC = () => {
//     const [estadoSeleccionado, setEstadoSeleccionado] = useState<number | null>(null);
//     const [municipioSeleccionado, setMunicipioSeleccionado] = useState<string | null>(null);

//     const municipios = estadoSeleccionado !== null ? estados[estadoSeleccionado].municipios : [];
//     const parroquias = municipioSeleccionado ? municipios.find(m => m.municipio === municipioSeleccionado)?.parroquias : [];

//     return (
//         <div>
//             <Select onValueChange={(value) => setEstadoSeleccionado(Number(value))}>
//                 <SelectTrigger>
//                     <SelectValue placeholder="Selecciona un estado" />
//                 </SelectTrigger>
//                 <SelectContent>
//                     {estados.map((estado, index) => (
//                         <SelectItem key={estado.id_estado} value={index.toString()}>
//                             {estado.estado}
//                         </SelectItem>
//                     ))}
//                 </SelectContent>
//             </Select>

//             {estadoSeleccionado !== null && (
//                 <Select onValueChange={(value) => setMunicipioSeleccionado(value)}>
//                     <SelectTrigger>
//                         <SelectValue placeholder="Selecciona un municipio" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         {municipios.map(municipio => (
//                             <SelectItem key={municipio.municipio} value={municipio.municipio}>
//                                 {municipio.municipio}
//                             </SelectItem>
//                         ))}
//                     </SelectContent>
//                 </Select>
//             )}

//             {municipioSeleccionado && (
//                 <Select>
//                     <SelectTrigger>
//                         <SelectValue placeholder="Selecciona una parroquia" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         {parroquias?.map(parroquia => (
//                             <SelectItem key={parroquia} value={parroquia}>
//                                 {parroquia}
//                             </SelectItem>
//                         ))}
//                     </SelectContent>
//                 </Select>
//             )}
//         </div>
//     );
// };

// export default SelectEstadosVenezuela;