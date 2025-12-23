"use client";

import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
} from "@mui/material";

import FormBahmni from "./FormBahmni";
import FormHapi from "./FormHapi";
import TransferPanel from "./Trans";
import FhirTrans from "./fhirtrans"; 

export default function Home() {
  const [selectedView, setSelectedView] = useState<
    "home" | "bahmni" | "hapi" | "transfer" | "fhirToBahmni"
  >("home");

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Vista principal */}
      {selectedView === "home" && (
        <Box textAlign="center">
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Registro Clínico Electrónico
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mb={4}>
            Seleccione una opción para ingresar o buscar pacientes.
          </Typography>

          <Stack spacing={3} direction="column" alignItems="center">

            {/* Crear en Bahmni */}
            <Card sx={{ width: "100%", maxWidth: 400, borderRadius: 3, boxShadow: 4 }}>
              <CardContent>
                <Button fullWidth variant="contained" color="primary"
                  onClick={() => setSelectedView("bahmni")}
                >
                  Crear Paciente en Bahmni
                </Button>
              </CardContent>
            </Card>

            {/* Crear en HAPI */}
            <Card sx={{ width: "100%", maxWidth: 400, borderRadius: 3, boxShadow: 4 }}>
              <CardContent>
                <Button fullWidth variant="contained" color="primary"
                  onClick={() => setSelectedView("hapi")}
                >
                  Ingresar paciente
                </Button>
              </CardContent>
            </Card>



            {/* Transferencia FHIR → Bahmni */}
            <Card sx={{ width: "100%", maxWidth: 400, borderRadius: 3, boxShadow: 4 }}>
              <CardContent>
                <Button fullWidth variant="contained" color="info"
                  onClick={() => setSelectedView("fhirToBahmni")}
                >
                  Buscar Pacientes
                </Button>
              </CardContent>
            </Card>


            {/* Transferencia Bahmni → HAPI */}
            <Card sx={{ width: "100%", maxWidth: 400, borderRadius: 3, boxShadow: 4 }}>
              <CardContent>
                <Button fullWidth variant="contained" color="secondary"
                  onClick={() => setSelectedView("transfer")}
                >
                  Buscar pacientes externos
                </Button>
              </CardContent>
            </Card>


          </Stack>
        </Box>

      )}


      {/* Formularios y vistas */}
      {selectedView === "bahmni" && (
        <Box>
          <Button variant="text" onClick={() => setSelectedView("home")}>
            ← Volver
          </Button>
          <FormBahmni />
        </Box>
      )}

      {selectedView === "hapi" && (
        <Box>
          <Button variant="text" onClick={() => setSelectedView("home")}>
            ← Volver
          </Button>
          <FormHapi />
        </Box>
      )}

      {selectedView === "transfer" && (
        <Box>
          <Button variant="text" onClick={() => setSelectedView("home")}>
            ← Volver
          </Button>
          <TransferPanel />
        </Box>
      )}

      {selectedView === "fhirToBahmni" && (
        <Box>
          <Button variant="text" onClick={() => setSelectedView("home")}>
            ← Volver
          </Button>
          <FhirTrans />
        </Box>
      )}
    </Container>
  );
}
