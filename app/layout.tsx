import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import theme from './theme';
import ModeSwitch from './components/ModeSwitch';
import Image from "next/image"; // <-- agregado

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <ThemeProvider theme={theme}>
          <CssBaseline />
          
          {/* Switch de tema */}
          <ModeSwitch />

 <header
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    padding: "10px 16px",
  }}
>
  {/* IZQUIERDA: primer logo */}
  <div style={{marginTop: "-180px"}}>
    <Image
      src="/fhir.png"
      alt="Logo Universidad"
      width={80} 
      height={98}
      priority
    />
  </div>

  {/* CENTRO: segundo logo */}
  <div style={{ justifySelf: "center" }}>
    <Image
      src="/logo.png"
      alt="Logo Centro"
      width={315}
      height={147}
      priority
    />
  </div>

  {/* DERECHA: espacio vacío que equilibra la grilla */}
  <div></div>
</header>



          {props.children}
        </ThemeProvider>
      </body>
    </html>
  );
}
