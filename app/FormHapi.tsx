"use client";
import * as React from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Autocomplete,
  Box,
} from "@mui/material";

import { useFormik } from "formik";
import * as Yup from "yup";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import dayjs from "dayjs";

type GenderOption = { label: string; value: string };
type sexOption = { label: string; value: string };
type nacionalidadOption = { label: string; value: string };

interface FormValues {
  givenName: string;
  middleName: string;
  familyName: string;
  secondFamilyName: string;
  rut: string;
  nacionalidad: nacionalidadOption | null;

  birthDate: dayjs.Dayjs | null;
  gender: GenderOption | null;
  sexobiologico: sexOption | null;

  phone: string;
  email: string;

  address1: string;
  city: string;
}

export default function FormHapi() {
  const genderOptions: GenderOption[] = [
    { label: "Hombre", value: "male" },
    { label: "Mujer", value: "female" },
    { label: "Otro", value: "other" },
  ];

  const sexOptions: sexOption[] = [
    { label: "Hombre", value: "Male" },
    { label: "Mujer", value: "Female" },
    { label: "Otro", value: "Other" },
    { label: "Desconocido", value: "Unknown" },
  ];

  const nacionalidadOptions: nacionalidadOption[] = [
    { label: "Chile", value: "152" },
    { label: "Argentina", value: "032" },
    { label: "Perú", value: "604" },
    { label: "Venezuela", value: "862" },
  ];

  const formik = useFormik<FormValues>({
    initialValues: {
      nacionalidad: null,
      rut: "",
      givenName: "",
      middleName: "",
      familyName: "",
      secondFamilyName: "",

      birthDate: null,
      gender: null,
      sexobiologico: null,
      email: "",
      phone: "",
      address1: "",
      city: "",
    },

    validationSchema: Yup.object({
      rut: Yup.string().required(),
      givenName: Yup.string().required(),
      familyName: Yup.string().required(),
      birthDate: Yup.date().nullable().max(new Date(), "La fecha no puede ser mayor a hoy").required(),
      gender: Yup.object().nullable().required(),
      sexobiologico: Yup.object().nullable().required(),
      email: Yup.string().email().nullable(),
      secondFamilyName: Yup.string().nullable().required(), 
      middleName: Yup.string().nullable().required(),
      phone: Yup.string().nullable().required(),
      address1: Yup.string().nullable(),
      city: Yup.string().nullable(),
      nacionalidad: Yup.object().nullable().required(),
    }),

    onSubmit: async (values) => {
      const fhirPatient = {
        resourceType: "Patient",

        identifier: [
          {
            use: "official",
            system:
              "https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSIdentificadoresCL",
            value: values.rut,
            type: {
              coding: [
                {
                  system:
                    "https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSCodigoDNI",
                  code: "NNCHL",
                  display: "Chile",
                },
              ],
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
            },
          },
        ],

        name: [
          {
            family: values.familyName,
            given: [values.givenName, values.middleName],
            extension: [
              {
                url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SegundoApellido",
                valueString: values.secondFamilyName,
              },
            ],
          },
        ],

        gender: values.gender?.value || "other",

        birthDate: values.birthDate
          ? dayjs(values.birthDate).format("YYYY-MM-DD")
          : null,

        telecom: [
          ...(values.phone
            ? [{ system: "phone", value: values.phone, use: "mobile" }]
            : []),
          ...(values.email
            ? [{ system: "email", value: values.email, use: "home" }]
            : []),
        ],

        address: [
          {
            line: [values.address1],
            city: values.city,
          },
        ],

        extension: [
          {
            url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SexoBiologico",
            valueCodeableConcept: {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/v3-AdministrativeGender",
                  code: values.sexobiologico?.value,
                  display: values.sexobiologico?.label,
                },
              ],
            },
          },
          {
            url: "https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/Nacionalidad",
            valueCodeableConcept: {
              coding: [
                {
                  system: "urn:iso:std:iso:3166",
                  code: values.nacionalidad?.value,
                  display: values.nacionalidad?.label,  
                },
              ],
            },
          },
        ],
      };

      console.log("FHIR JSON generado →", fhirPatient);

      try {
        const res = await fetch("http://localhost:8081/fhir/Patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fhirPatient),
        });

        const data = await res.json();
        alert("Respuesta del servidor: " + JSON.stringify(data));
      } catch (err) {
        alert("Error conectando al servidor " + err);
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Ingresar datos del paciente
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            label="RUT"
            name="rut"
            margin="normal"
            value={formik.values.rut}
            onChange={formik.handleChange}
          />

          <TextField
            fullWidth
            label="Primer Nombre"
            name="givenName"
            margin="normal"
            value={formik.values.givenName}
            onChange={formik.handleChange}
          />

          <TextField
            fullWidth
            label="Segundo Nombre"
            name="middleName"
            margin="normal"
            value={formik.values.middleName}
            onChange={formik.handleChange}
          />

          <TextField
            fullWidth
            label="Primer Apellido"
            name="familyName"
            margin="normal"
            value={formik.values.familyName}
            onChange={formik.handleChange}
          />

          <TextField
            fullWidth
            label="Segundo Apellido"
            name="secondFamilyName"
            margin="normal"
            value={formik.values.secondFamilyName}
            onChange={formik.handleChange}
          />

          <Autocomplete
            options={genderOptions}
            getOptionLabel={(option) => option.label}
            value={formik.values.gender ?? null}
            onChange={(e, v) => formik.setFieldValue("gender", v)}
            renderInput={(params) => (
              <TextField {...params} label="Genero" margin="normal" />
            )}
          />

          <Autocomplete
            options={sexOptions}
            getOptionLabel={(option) => option.label}
            value={formik.values.sexobiologico ?? null}
            onChange={(e, v) => formik.setFieldValue("sexobiologico", v)}
            renderInput={(params) => (
              <TextField {...params} label="Sexo biológico" margin="normal" />
            )}
          />

          <Stack my={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha de nacimiento"
                value={formik.values.birthDate}
                maxDate={dayjs()}
                onChange={(newValue) =>
                  formik.setFieldValue("birthDate", newValue)
                }
              />
            </LocalizationProvider>
          </Stack>

          <TextField
            fullWidth
            label="Teléfono"
            name="phone"
            margin="normal"
            value={formik.values.phone}
            onChange={formik.handleChange}
          />

          <TextField
            fullWidth
            label="Correo electrónico"
            name="email"
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
          />

         <Autocomplete
            options={nacionalidadOptions}
            getOptionLabel={(option) => option.label}
            value={formik.values.nacionalidad ?? null}
            onChange={(e, v) => formik.setFieldValue("nacionalidad", v)}
            renderInput={(params) => (
              <TextField {...params} label="Nacionalidad" margin="normal" />
            )}
          />

          <TextField
            fullWidth
            label="Dirección"
            name="address1"
            margin="normal"
            value={formik.values.address1}
            onChange={formik.handleChange}
          />

          <TextField
            fullWidth
            label="Ciudad"
            name="city"
            margin="normal"
            value={formik.values.city}
            onChange={formik.handleChange}
          />

          <Button variant="contained" type="submit" sx={{ mt: 3 }}>
            Guardar Paciente
          </Button>
        </form>
      </Box>
    </Container>
  );
}
