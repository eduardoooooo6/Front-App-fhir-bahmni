"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";

// ==========================
// Tipos
// ==========================

interface Identifier {
  use?: string;
  system?: string;
  type?: {
    coding?: Array<{ system: string; code: string; display: string }>;
    extension?: Array<{
      url: string;
      valueCodeableConcept?: {
        coding: Array<{ system: string; code: string; display: string }>;
      };
    }>;
  };
  value?: string;
}

interface FhirHumanName {
  family: string;
  given: string[];
  extension?: Array<{ url: string; valueString: string }>;
}

interface FhirTelecom {
  system: string;
  value: string;
  use: string;
}

interface FhirAddress {
  line?: string[];
  city?: string;
}

interface FhirExtension {
  url: string;
  valueString?: string;
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
}

interface FhirPatient {
  resourceType: string;
  id?: string;
  name: FhirHumanName[];
  gender: string;
  birthDate: string;
  identifier?: Identifier[];
  telecom?: FhirTelecom[];
  address?: FhirAddress[];
  extension?: FhirExtension[];
}

export default function FhirTrans() {
  const [searchName, setSearchName] = useState("");
  const [results, setResults] = useState<FhirPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<FhirPatient | null>(null);
  const [loading, setLoading] = useState(false);
  const [bahmniResponse, setBahmniResponse] = useState<any>(null);
  const [error, setError] = useState("");

  const backend = "http://localhost:5000"; // FASTAPI
  const hapiFhirUrl = "http://localhost:8081/fhir/Patient";

  // ===========================
  // BUSCAR PACIENTES POR NOMBRE
  // ===========================
  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    setResults([]);
    setSelectedPatient(null);
    setBahmniResponse(null);
    setError("");

    try {
      const res = await fetch(
        `${hapiFhirUrl}?name=${encodeURIComponent(searchName)}`,
        { headers: { Accept: "application/fhir+json" } }
      );
      const bundle = await res.json();

      if (!bundle.entry || bundle.entry.length === 0) {
        setError("No se encontraron pacientes.");
        setLoading(false);
        return;
      }

      const list = bundle.entry.map((e: any) => e.resource);
      setResults(list);
    } catch (err) {
      console.error("Error consultando en el servidor:", err);
      setError("Error consultando en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // SELECCIONAR PACIENTE
  // ===========================
  const handleSelectPatient = (patient: FhirPatient) => {
    setSelectedPatient(patient);
    setBahmniResponse(null);
    setError("");
  };

  // ===========================
  // ENVIAR PACIENTE A BAHMNI
  // ===========================
  const handleSendToBahmni = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setBahmniResponse(null);
    setError("");

    try {
      const payload = { ...selectedPatient };

      // ===========================
      // PASO 1: Extraer Sexo Biológico desde FHIR
      // ===========================
      const sexoBiologicoExt = payload.extension?.find(
        (ext) =>
          ext.url ===
          "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SexoBiologico"
      );

      const sexoBiologico =
        sexoBiologicoExt?.valueCodeableConcept?.coding?.[0]?.code ?? null;

      console.log("Sexo biológico extraído:", sexoBiologico);


      // Eliminar id
      delete payload.id;

      // Normalizar gender
      payload.gender = payload.gender?.toLowerCase() || "unknown";

      // Inicializar extension si no existe
      if (!payload.extension) payload.extension = [];

      // Agregar Segundo Apellido a extension (si existe)
      const name = payload.name?.[0];
      if (name?.given?.[1]) {
        payload.extension.push({
          url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SegundoApellido",
          valueString: name.given[1],
        });
      }

      // Agregar RUT a extension (si existe en identifier)
      const rutId = payload.identifier?.find(
        (id) =>
          id.use === "official" &&
          id.system === "https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSIdentificadoresCL"
      );
      if (rutId?.value) {
        payload.extension.push({
          url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CodigoIdentificador",
          valueString: rutId.value,
        });
      }

      // Normalizar direcciones
      if (payload.address && payload.address.length > 0) {
        payload.address = payload.address.map((a) => {
          const addr = { ...a };
          if (addr.line?.length === 0 || addr.line?.every((l) => l === "")) delete addr.line;
          return addr;
        });
      }

      console.log("Enviando a Bahmni:", payload);

      const res = await fetch(`${backend}/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("Respuesta de Bahmni:", json);

      if (res.ok) {
        setBahmniResponse(json);
      } else {
        setError(`Error de Bahmni: ${json.message || "Revisar consola"}`);
      }
    } catch (err: any) {
      console.error("Error enviando a Bahmni:", err);
      setError("Error enviando a Bahmni, revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // RENDER PACIENTE
  // ===========================
  const renderPatientCard = (patient: FhirPatient) => {
    const name = patient.name?.[0];
    const segundoApellido =
      name?.extension?.find(
        (ext) =>
          ext.url ===
          "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SegundoApellido"
      )?.valueString || "";

    const rut =
      patient.identifier?.find(
        (id) =>
          id.use === "official" &&
          id.system ===
            "https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSIdentificadoresCL"
      )?.value || "";

    const addressLine = patient.address?.[0]?.line?.join(" ") || "";
    const city = patient.address?.[0]?.city || "";
    

    const sexoBiologico =
      patient.extension?.find(
        (ext) =>
          ext.url ===
          "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SexoBiologico"
      )?.valueCodeableConcept?.coding?.[0]?.display || "";

    const nacionalidad =
      patient.extension?.find(
        (ext) =>
          ext.url ===
          "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/Nacionalidad"
      )?.valueCodeableConcept?.coding?.[0]?.display || "";
    
    const email =
      patient.telecom?.find(
        (t) => t.system === "email"
      )?.value || "";



    return (
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

          {/* Nombres */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Nombres
            </Typography>
            <Typography>{name?.given?.join(" ") || "—"}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />

          {/* Primer Apellido */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Primer Apellido
            </Typography>
            <Typography>{name?.family || "—"}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />

          {/* Segundo Apellido */}
          {segundoApellido && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Segundo Apellido
                </Typography>
                <Typography>{segundoApellido}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Sexo biológico */}
          {sexoBiologico && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Sexo biológico
                </Typography>
                <Typography>{sexoBiologico}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Género */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Género
            </Typography>
            <Typography>{patient.gender || "—"}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />

          {/* Fecha de nacimiento */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Fecha de nacimiento
            </Typography>
            <Typography>{patient.birthDate || "—"}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />

          {/* RUT */}
          {rut && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  RUT
                </Typography>
                <Typography>{rut}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Nacionalidad */}
          {nacionalidad && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Nacionalidad
                </Typography>
                <Typography>{nacionalidad}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Dirección */}
          {(addressLine || city) && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Dirección
                </Typography>
                <Typography>{addressLine}</Typography>
                <Typography>{city}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Teléfonos */}
          {(patient.telecom ?? []).some((t) => t.system === "phone") && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Teléfonos
              </Typography>

              {(patient.telecom ?? [])
                .filter((t) => t.system === "phone")
                .map((t, i) => (
                  <Typography key={i}>
                    {t.use === "mobile" ? "Móvil" : "Teléfono"}: {t.value}
                  </Typography>
                ))}
            </Box>
          )}


          {/* Correo electrónico */}
          {email && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Correo electrónico
                </Typography>
                <Typography>{email}</Typography>
              </Box>
            </>
          )}



          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{ mt: 2, fontWeight: "bold" }}
            onClick={handleSendToBahmni}
            disabled={loading}
          >
            {loading ? "Transfiriendo..." : "Transferir Paciente"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Buscar paciente en el sistema clínico electrónico
      </Typography>

      <TextField
        label="Buscar por nombre"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        sx={{ width: "60%", mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleSearch}
        disabled={loading || !searchName}
        sx={{ ml: 1 }}
      >
        Buscar
      </Button>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {results.length > 0 && (
        <List sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
          {results.map((p) => (
            <ListItem key={p.id} disablePadding>
              <ListItemButton onClick={() => handleSelectPatient(p)}>
                <ListItemText
                  primary={p.name?.[0]?.given?.join(" ") + " " + p.name?.[0]?.family}
                  secondary={`ID: ${p.id}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {selectedPatient && renderPatientCard(selectedPatient)}

      {bahmniResponse && (
        <pre
          style={{
            background: "#003300",
            color: "white",
            padding: 12,
            borderRadius: 8,
            maxHeight: 300,
            overflow: "auto",
            marginTop: "2rem",
          }}
        >
          {JSON.stringify(bahmniResponse, null, 2)}
        </pre>
      )}
    </div>
  );
}
