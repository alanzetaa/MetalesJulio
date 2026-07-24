// Texto de arranque, genérico para este tipo de comunidad (conecta gente,
// no interviene en las operaciones entre miembros) -- pedido explícito del
// dueño para completar el perfil mientras se define una versión definitiva
// más adelante. Ver reglas.md ("Términos y Condiciones").
export function TerminosContenido() {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      <p className="hint" style={{ marginTop: 0 }}>Última actualización: {new Date().toLocaleDateString("es-AR")}</p>

      <h4>1. Qué es esta plataforma</h4>
      <p>
        Comunidad Metales Julio es un espacio de encuentro entre artesanos, técnicos y oficios vinculados
        al metal (soldadores, herreros, joyeros, torneros, escultores y similares) y personas que buscan
        sus productos o servicios. Su único propósito es facilitar el contacto entre las partes.
      </p>

      <h4>2. No somos parte de ninguna transacción</h4>
      <p>
        Metales Julio y los responsables de esta plataforma <strong>no son parte, no intervienen y no se
        benefician económicamente</strong> de ningún acuerdo, compraventa, encargo de trabajo o
        intercambio que se realice entre los miembros de la comunidad. Cualquier trato, pago, entrega,
        garantía, plazo o condición se acuerda exclusivamente entre las personas involucradas, bajo su
        propia responsabilidad.
      </p>

      <h4>3. Sin responsabilidad por lo que ocurra entre miembros</h4>
      <p>No garantizamos ni respondemos por:</p>
      <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
        <li>La calidad, legalidad, veracidad o cumplimiento de lo publicado u ofrecido por cualquier miembro.</li>
        <li>El resultado de cualquier acuerdo, trabajo, compra o venta pactada entre miembros.</li>
        <li>Daños, pérdidas, incumplimientos, estafas o conflictos que puedan surgir entre las partes.</li>
      </ul>
      <p>
        Cada persona es responsable de verificar con quién trata y de resolver cualquier desacuerdo
        directamente con la otra parte.
      </p>

      <h4>4. Tus datos</h4>
      <p>
        Al registrarte, nos das tu nombre, apellido, DNI, email y (opcionalmente) CUIT para verificar tu
        identidad dentro de la comunidad. El DNI, el CUIT y el email de tu cuenta son privados: nunca se
        muestran a otros miembros ni se publican. Lo que vos decidís cargar (nombre, provincia,
        descripción) queda visible para el resto de la comunidad una vez que completás tu perfil, y el
        contacto entre miembros se hace exclusivamente por mensajería privada dentro de la plataforma.
      </p>

      <h4>5. Tu responsabilidad como miembro</h4>
      <p>
        Sos responsable de que los datos que cargues sean verdaderos, de las publicaciones que hagas, y de
        cómo te comuniques con otros miembros. No está permitido usar la comunidad para fines distintos a
        los que fue creada (ofrecer o buscar trabajos/artesanías vinculadas al metal).
      </p>

      <h4>6. Moderación</h4>
      <p>
        Nos reservamos el derecho de suspender o eliminar cuentas o publicaciones que incumplan estas
        condiciones o que generen reportes de mal uso, sin que eso genere derecho a reclamo alguno.
      </p>

      <h4>7. Cambios en estos términos</h4>
      <p>
        Estos términos pueden actualizarse con el tiempo. Los cambios importantes se van a avisar dentro
        de la plataforma.
      </p>
    </div>
  );
}
