"use client";
import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Divider, Box, Button, TextField } from "@mui/material";

// ==========================
// Tipos
// ==========================
interface FhirTelecom {
  system: string;
  value: string;
  use: string;
}

interface FhirHumanName {
  family: string;
  given: string[];
  extension?: {
    url: string;
    valueString: string;
  }[];
}

export interface PersonAttribute {
  uuid: string;
  display: string;
  links: {
    rel: string;
    uri: string;
    resourceAlias: string;
  }[];
}

interface FhirPatient {
  resourceType: string;
  id: string;

  identifier: Identifier[];

  name: FhirHumanName[];

  gender: string;
  birthDate: string;

  address: {
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    url?: string;
  }[];

  extension?: PersonAttribute[];
  telecom?: FhirTelecom[];
}

interface Patient {
  uuid: string;
  display: string;
  links: { uri: string }[];
}

interface SearchResponse {
  results?: Patient[];
  error?: string;
}

interface SearchByIdResponse {
  fhir: FhirPatient;
}

interface ReviewLinkResponseAddress {
  data: LinkResponseAddress;
  message: string | null;
  status: string | null;
}

interface LinkResponseAddress {
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  address5: string | null;
  address6: string | null;
  address7: string | null;
  address8: string | null;
  address9: string | null;
  address10: string | null;
  address11: string | null;
  address12: string | null;
  address13: string | null;
  address14: string | null;
  address15: string | null;

  cityVillage: string | null;
  country: string | null;
  countyDistrict: string | null;
  display: string | null;

  endDate: string | null;
  latitude: string | null;
  longitude: string | null;

  links: {
    rel: string;
    uri: string;
  }[];

  postalCode: string | null;
  preferred: boolean;
  resourceVersion: string;
  startDate: string | null;
  stateProvince: string | null;
  uuid: string;
  voided: boolean;

  message: string | null;
  status: string | null;
}

export interface PersonAttributeDetail {
  display: string;
  uuid: string;
  value: string;
  attributeType: {
    uuid: string;
    display: string;
    links: {
      rel: string;
      uri: string;
      resourceAlias: string;
    }[];
  };
  voided: boolean;
  links: {
    rel: string;
    uri: string;
    resourceAlias: string;
  }[];
  resourceVersion: string;
}

interface ReviewPersonAttributeDetail {
  data: PersonAttributeDetail;
  message: string | null;
  status: string | null;
}

interface telecomInterface {
  system: string;
  value: string;
  use: string;
}

export interface Identifier {
  use?: string;
  system?: string;
  type?: {
    extension?: Array<{
      url: string;
      valueCodeableConcept?: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
      };
    }>;
    coding?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  value?: string;
}

interface FHIRInterface {
  address: (
    | {
        line: string[] | undefined;
        city?: undefined;
      }
    | {
        city: string | null;
        line?: undefined;
      }
  )[];
  telecom: telecomInterface[];
  resourceType: string;
  id: string;
  name: FhirHumanName[];
  gender: string;
  birthDate: string;
  identifier: Identifier[];
  extension: Extension[];
}

export interface Coding {
  system: string;
  code: string;
  display?: string;
}

export interface CodeableConcept {
  coding: Coding[];
}

export interface Extension {
  url: string;
  valueCodeableConcept?: CodeableConcept;
  extension?: Extension[];
}


// ==========================
// Componente
// ==========================
export default function TransferPanel() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [uniquePatient, setUniquePatient] = useState<FHIRInterface | null>(null);

  const countryNameToCodeMap: Record<string, string> = {
    Chile: "152",
    Perú: "604",
    Venezuela: "862",
    Argentina: "032",
  };

  const getCountryCodeByName = (
    countryName: string
  ): string | undefined => {
    return countryNameToCodeMap[countryName];
  };

  const genderCodeToNameMap = new Map<string, string>([
    ["male", "Masculino"],
    ["female", "Femenino"],
    ["other", "Otro"],
    ["unknown", "Desconocido"],
  ]);

  const getGenderIndexByCode = (
    code: string
  ): number | undefined => {
    const normalizedCode =
      code.charAt(0).toLowerCase() + code.slice(1).toLowerCase();

    let index = 1;

    for (const key of genderCodeToNameMap.keys()) {
      if (key === normalizedCode) {
        return index;
      }
      index++;
    }

    return undefined;
  };

  const firstLetterLowercase = (value: string): string => {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  };

  const handleClear = () => {
    setPatients([]);
    setUniquePatient(null);
    setQuery("");
    setError("");
  };

  const extractUuidFromUrl = (url: string): string => {
    const cleanUrl = url.split("?")[0].split("#")[0];
    const segments = cleanUrl.split("/").filter((s) => s.length > 0);
    return segments[segments.length - 1];
  };

  const handlePatientClick = async (patient: Patient) => {
    if (!patient.links || patient.links.length === 0) {
      setError("No hay URL disponible para este paciente.");
      return;
    }

    const uuid = extractUuidFromUrl(patient.links[0].uri);
    setLoadingPatient(true);
    setError("");
    setUniquePatient(null);

    try {
      // GET que trae data del search_by_id
      const res = await axios.get<SearchByIdResponse>(
        `http://127.0.0.1:5000/search_by_id?id=${uuid}`
      );

      const data: SearchByIdResponse = res.data;

      console.log("📌 FHIR recibido:", JSON.stringify(data.fhir, null, 2));

      // BUSCA información adicional para completar FHIR relacionada a la direccion
      const addressInfo = await axios.get<ReviewLinkResponseAddress>(
        `http://127.0.0.1:5000/review_url?url=${data.fhir.address?.[0]?.url}`
      );

      const addressData: LinkResponseAddress = addressInfo.data.data;

      const telecom: telecomInterface[] = [];
      const identifier: Identifier[] = [];
      const extensions: Extension[] = [];

      // SEGUNDO APELLIDO → PARA GUARDARLO PROVISORIAMENTE
      let segundoApellido: string | null = null;

      // RECORRE EXTENSIONES PARA COMPLETAR TELECOM Y OTROS SEGUN SEA NECESARIO
      await Promise.all(
        data.fhir.extension?.map(async (item) => {
          console.log("📌 Extensión:", item.links[0].uri);

          // GET PARA TRAER DETALLE DE CADA EXTENSIÓN
          const extensionInfo = await axios.get<ReviewPersonAttributeDetail>(
            `http://127.0.0.1:5000/review_url?url=${item.links[0].uri}`
          );

          const itemExtension = extensionInfo.data.data;

          // PHONE NUMBER
          if (itemExtension.attributeType.uuid === "a384873b-847a-4a86-b869-28fb601162dd") {
            telecom.push({
              system: "phone",
              value: itemExtension.display,
              use: "mobile",
            });
          }

          // EMAIL
          if (itemExtension.attributeType.uuid === "e3123cba-5e07-11ef-8f7c-0242ac120002") {
            telecom.push({
              system: "email",
              value: itemExtension.display,
              use: "home",
            });
          }

          // Nacionalidad
          if (itemExtension.attributeType.uuid === "7bb331e1-968f-4e26-96c5-cc9eb55fba11") {
            extensions.push({
              url: "code",
              valueCodeableConcept: {
                coding : [
                  {
                    "system" : "urn:iso:std:iso:3166",
                    "code" : getCountryCodeByName(itemExtension.display || "") || "",
                    "display" : itemExtension.display || ""
                  }
                ]
              }
            });
          }

          // SexoBiologico
          if (itemExtension.attributeType.uuid === "7c8d50bd-73d0-40ef-8f9a-12057b61286e") {
            extensions.push(
                  {
                    extension : [
                      {
                        url : "value",
                        valueCodeableConcept : {
                          coding : [
                            {
                              system : "https://interoperabilidad.minsal.cl/fhir/ig/eis/CodeSystem/CSIdentidadGenero",
                              code : getGenderIndexByCode(data.fhir.gender || "")?.toString() || "no sirve",
                              display : genderCodeToNameMap.get(data.fhir.gender || "")
                            }
                          ]
                        }
                      }
                    ],
                    "url" : "http://hl7.org/fhir/StructureDefinition/individual-genderIdentity"
                  },
                  {
                    url : "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SexoBiologico",
                    valueCodeableConcept : {
                      coding : [
                        {
                          system : "http://hl7.org/fhir/administrative-gender",
                          code : firstLetterLowercase(itemExtension.display || ""),
                          display : itemExtension.display
                        }
                      ]
                    }
                  }
          );
          }

          // RUT 
          if (itemExtension.attributeType.uuid === "9c50f6db-e624-4aa6-9454-d8b1d49b2bf3") {
            identifier.push({
              use: "official",
              system:
                "https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSIdentificadoresCL",
              type: {
                extension: [
                  {
                    url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CodigoPaises",
                    valueCodeableConcept: {
                      coding: [
                        {
                          system: "urn:iso:std:iso:3166",
                          code: "152",
                          display: "Chile",
                        },
                      ],
                    },
                  },
                ],
                coding: [
                  {
                    system:
                      "https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSCodigoDNI",
                    code: "NNCHL",
                    display: "Chile",
                  },
                ],
              },
              value: itemExtension.display,
            });
          }


          //SEGUNDO APELLIDO 
          if (itemExtension.attributeType.uuid === "e628c57c-8077-422a-a016-2b295998cf36") {
            console.log("Segundo apellido encontrado:", itemExtension.display);

            segundoApellido = itemExtension.display;

          }
        }) || []
      );
      console.log("📌 identifier armado:", JSON.stringify(identifier, null, 2));
      console.log("📌 telecom armado:", JSON.stringify(telecom, null, 2));
      console.log("📌 extension armado:", JSON.stringify(extensions, null, 2));


      // Estructura final FHIR con datos completos
      const dataFhir = {...data.fhir,
        address: [
          {line: data.fhir.address?.[0].line},
          {city: addressData.cityVillage},
         // {country: addressData.country},
          //{state: addressData.stateProvince},
          //{postalCode: addressData.postalCode},
                                                            // SEGUIR AGREGANDO VALORES SEGUN SEA NECESARIO
        ],
        telecom: [...telecom],
        identifier: [...identifier],
        extension: [...extensions],
      };
      // Agregar extensión CLCore del segundo apellido
      if (segundoApellido) {
        dataFhir.name[0].extension = [
          ...(dataFhir.name[0].extension || []),
          {
            url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SegundoApellido",
            valueString: segundoApellido,
          },
        ];
      }

      console.log("📌 newDataFhir despues:", JSON.stringify(dataFhir, null, 2));
      
      setUniquePatient(dataFhir);

    } catch (err: any) {
      console.error("Error al consultar paciente:", err);
      setError(
        err.response?.data?.error ||
        "Error al consultar los datos del paciente."
      );
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Por favor, ingresa un nombre para buscar.");
      return;
    }

    setLoading(true);
    setError("");
    setPatients([]);

    try {
      const res = await axios.get<SearchResponse>(
        `http://127.0.0.1:5000/search?name=${query}`
      );

      const data: SearchResponse = res.data;

      console.log("📌 Resultado búsqueda:", JSON.stringify(data, null, 2));

      if (data.error) {
        setError(data.error);
      } else if (data.results && data.results.length === 1) {
        handlePatientClick(data.results[0]);
      } else if (data.results && data.results.length > 0) {
        setPatients(data.results);
      } else {
        setError("No se encontraron pacientes con ese nombre.");
      }
    } catch (err) {
      setError("Error al conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!uniquePatient) return;

    console.log("📤 Enviando a HAPI:", JSON.stringify(uniquePatient, null, 2));

    try {
      await axios.post("http://127.0.0.1:5000/send_to_hapi", uniquePatient);
      alert("Paciente transferido correctamente a HAPI FHIR");
    } catch (err: any) {
      console.error("Error al transferir:", err);
      alert(
        err.response?.data?.error ||
        "Error al transferir el paciente a HAPI FHIR."
      );
    }
  };
//TODO: Pruebamela
  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>Búsqueda de Pacientes</h2>

      {/* Buscador */}
      <div style={{ marginTop: "1rem" }}>
       {/* 
        <input
          type="text"
          placeholder="Ingresar nombre o Rut del paciente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "0.5rem",
            width: "60%",
            marginRight: "0.5rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        /> */}

        <TextField
          label="Buscar por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ width: "60%", mb: 2 }}
        />


        <button
          onClick={handleSearch}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
        >
          Buscar
        </button>

        <button
          onClick={handleClear}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
        >
          Limpiar
        </button>
      </div>

      {loading && <p style={{ marginTop: "1rem" }}>Buscando...</p>}
      {error && <p style={{ marginTop: "1rem", color: "red" }}>{error}</p>}

      {/* Lista de pacientes */}
      {!uniquePatient && patients.length > 1 && (
        <ul style={{ marginTop: "1.5rem", listStyle: "none", padding: 0 }}>
          {patients.map((p) => (
            <li key={p.uuid} style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => handlePatientClick(p)}
                disabled={loadingPatient}
                style={{
                  background: "none",
                  border: "none",
                  color: loadingPatient ? "#ccc" : "#007bff",
                  fontWeight: "bold",
                  cursor: loadingPatient ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                  fontSize: "1rem",
                }}
              >
                {p.display}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* CARD CON PACIENTE ÚNICO */}
      {uniquePatient && (
  <Card
    sx={{
      maxWidth: 600,
      margin: "2rem auto",
      borderRadius: 3,
      boxShadow: 4,
      textAlign: "left",
      bgcolor: "background.paper",
    }}
  >
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
        Paciente Seleccionado
      </Typography>

      {/* Nombre */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Nombres
        </Typography>
        <Typography>{uniquePatient.name[0].given.join(" ")}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Primer apellido */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Primer Apellido
        </Typography>
        <Typography>{uniquePatient.name[0].family}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

{/* Segundo Apellido basado en CLCore */}
      {uniquePatient.name?.[0]?.extension && (
        (() => {
          const segundoApellidoExt = uniquePatient.name[0].extension.find(
            (ext) =>
              ext.url ===
              "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SegundoApellido"
          );

          return segundoApellidoExt ? (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Segundo Apellido
              </Typography>
              <Typography>{segundoApellidoExt.valueString}</Typography>
            </Box>
          ) : null;
        })()
      )}



      <Divider sx={{ my: 1 }} />

      {/* Género */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Género
        </Typography>
        <Typography>{uniquePatient.extension?.find(ext => ext.url === "http://hl7.org/fhir/StructureDefinition/individual-genderIdentity")?.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display || "No disponible"}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />
      {/* Fecha nacimiento */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Sexo biológico
        </Typography>
        <Typography>{uniquePatient.extension?.find(ext => ext.url === "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SexoBiologico")?.valueCodeableConcept?.coding?.[0]?.display || "No disponible"}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Fecha nacimiento */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Fecha de nacimiento
        </Typography>
        <Typography>{uniquePatient.birthDate}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Identificadores */}
      {/* RUT */}
      {uniquePatient.identifier?.[0] && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            RUT
          </Typography>

          <Typography>
            {uniquePatient.identifier[0].value || "—"}
          </Typography>
        </Box>
      )}
      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Pais de Origen
        </Typography>
        <Typography>{uniquePatient.extension?.find(ext => ext.url === "code")?.valueCodeableConcept?.coding?.[0]?.display || "No disponible"}</Typography>
      </Box>


      <Divider sx={{ my: 1 }} />

      {/* Dirección */}
      {uniquePatient.address?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Dirección
          </Typography>

          <Typography>
            {uniquePatient.address[0].line?.join(" ") || "—"}
          </Typography>

          <Typography>
            {uniquePatient.address[1]?.city || ""}
          </Typography>

         
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Telecom */}
      {uniquePatient.telecom && uniquePatient.telecom.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Datos de contacto
          </Typography>

          {uniquePatient.telecom.map((t, i) => (
            <Typography key={i}>
              {t.system === "email" ? "Correo" : "Teléfono"}: {t.value}
            </Typography>
          ))}
        </Box>
      )}

      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 2, fontWeight: "bold" }}
        onClick={handleTransfer}
      >
        Transferir Paciente a HAPI FHIR
      </Button>
    </CardContent>
  </Card>
)}
  </div>
  );
}
