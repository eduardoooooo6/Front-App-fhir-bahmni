"use client";
import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, TextField, Stack, Autocomplete } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

type GenderOption = { label: string; value: string };

interface FormValues {
  givenName: string;
  middleName: string;
  familyName: string;
  secondFamilyName: string; 
  rut: string;              
  address1: string;
  address2: string;
  cityVillage: string;
  countyDistrict: string;
  stateProvince: string;
  postalCode: string;
  birthdate: dayjs.Dayjs | null;
  gender: GenderOption | null;
  phone: string;
}

export default function PatientForm() {
  const genderOptions: GenderOption[] = [
    { label: "Mujer", value: "female" },
    { label: "Hombre", value: "male" },
    { label: "Otro", value: "other" },
  ];

  const formik = useFormik<FormValues>({
    initialValues: {
      givenName: "",
      middleName: "",
      familyName: "",
      secondFamilyName: "", 
      rut: "",
      address1: "",
      address2: "",
      cityVillage: "",
      countyDistrict: "",
      stateProvince: "",
      postalCode: "",
      birthdate: null,
      gender: null,
      phone: "",
    },
    validationSchema: Yup.object().shape({
      givenName: Yup.string().required("Campo requerido."),
      familyName: Yup.string().required("Campo requerido."),
      birthdate: Yup.date().nullable().required("Campo requerido."),
      gender: Yup.object().nullable().required("Campo requerido."),
      phone: Yup.string().notRequired(),
      secondFamilyName: Yup.string(),
      rut: Yup.string().matches(/^[0-9kK\-]+$/, "RUT inválido").notRequired(),
    }),
    onSubmit: async (values) => {
      const fhirPatient = {
        name: [
          {
            given: [values.givenName, values.middleName || ""],
            family: values.familyName
          }
        ],
        gender: values.gender ? values.gender.value : "other",
        birthDate: values.birthdate
          ? dayjs(values.birthdate).format("YYYY-MM-DD")
          : null,
        address: [
          {
            line: [values.address1, values.address2 || ""],
            city: values.cityVillage,
            county: values.countyDistrict,
            state: values.stateProvince,
            postalCode: values.postalCode
          }
        ],
        telecom: values.phone
          ? [{ system: "phone", value: values.phone }]
          : [],
        extension: [
          { url: "http://example.org/fhir/StructureDefinition/segundo-apellido", valueString: values.secondFamilyName },
          { url: "http://example.org/fhir/StructureDefinition/rut", valueString: values.rut }
        ]
      };

      try {
        const res = await fetch("http://localhost:5000/map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fhirPatient),
        });

        const data = await res.json();
        if (data.status === "OK") {
          alert("Paciente creado en Bahmni!");
        } else {
          alert("Error: " + data.message);
        }
      } catch (err) {
        alert("No se pudo conectar a la API: " + err);
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Formulario Paciente Bahmni
        </Typography>

        <form onSubmit={formik.handleSubmit} noValidate>
          <TextField fullWidth label="Nombre" name="givenName" margin="normal"
            value={formik.values.givenName} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Segundo nombre" name="middleName" margin="normal"
            value={formik.values.middleName} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Apellido" name="familyName" margin="normal"
            value={formik.values.familyName} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Segundo apellido" name="secondFamilyName" margin="normal"
            value={formik.values.secondFamilyName || ""} onChange={formik.handleChange}
          />
          <TextField fullWidth label="RUT" name="rut" margin="normal"
            value={formik.values.rut || ""} onChange={formik.handleChange}
          />

          <Autocomplete
            options={genderOptions}
            getOptionLabel={(option) => option.label}
            value={formik.values.gender}
            onChange={(event, value) => formik.setFieldValue("gender", value)}
            renderInput={(params) => (
              <TextField {...params} label="Sexo" margin="normal" />
            )}
          />

          <Stack my={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha de nacimiento"
                value={formik.values.birthdate}
                onChange={(newValue) => formik.setFieldValue("birthdate", newValue)}
              />
            </LocalizationProvider>
          </Stack>

          <TextField fullWidth label="Dirección 1" name="address1" margin="normal"
            value={formik.values.address1} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Dirección 2" name="address2" margin="normal"
            value={formik.values.address2} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Ciudad" name="cityVillage" margin="normal"
            value={formik.values.cityVillage} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Comuna" name="countyDistrict" margin="normal"
            value={formik.values.countyDistrict} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Región" name="stateProvince" margin="normal"
            value={formik.values.stateProvince} onChange={formik.handleChange}
          />
          <TextField fullWidth label="Código Postal" name="postalCode" margin="normal"
            value={formik.values.postalCode} onChange={formik.handleChange}
          />

          <TextField fullWidth label="Teléfono" name="phone" margin="normal"
            value={formik.values.phone} onChange={formik.handleChange}
          />

          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            Guardar Paciente
          </Button>
        </form>
      </Box>
    </Container>
  );
}
