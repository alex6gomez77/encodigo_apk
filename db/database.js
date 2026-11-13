export const obtenerFiltro = (db,tablaId) => {
  return db.getFirstSync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    [tablaId]
  );
};

export const eliminarFiltro = (db, tablaId) => {
  return db.runAsync(`DELETE FROM filtros WHERE tabla_id = ?;`, [tablaId]);
  
}

export const actualizarFiltro = async (db, tablaId, campo, filtro) => {
  
  await db.runAsync(`DELETE FROM filtros WHERE tabla_id = ?;`, [tablaId]);
  return db.runAsync(`INSERT INTO filtros (campo, signo, valor, filtro, tabla_id) VALUES (?, ?, ?, ?, ?)`,  
  campo, "=", filtro, "'" +  filtro.toUpperCase() + "'", tablaId );
  
}



//OBJETOS DE OBRA
export const obtenerObjetosdeobras = (db) => {
  return db.getAllAsync(
    `SELECT objetosdeobras.* , generales.objetodeobra_activo as activo
    FROM objetosdeobras 
    LEFT JOIN generales ON generales.objetodeobra_activo = objetosdeobras.id 
    ORDER BY objetosdeobras.objetodeobra
    ` );
};

export const obtenerObjetodeobraActivo = (db) => {
  return db.getFirstAsync(
    'SELECT objetodeobra_activo FROM generales ORDER BY id LIMIT 1');
};

export const establecerObjetodeobraActivo = (db, objetodeobra_id) => {
  return db.runAsync(
    `UPDATE generales SET 
    objetodeobra_activo=?
    `,
    [objetodeobra_id]
  );
}

//ETAPAS
export const obtenerEtapas = (db) => {
  return db.getAllAsync(
    `SELECT subetapas.*
    FROM subetapas 
    ORDER BY subetapas.IDSubEtapa, subetapas.SubEtapa
    ` );
};

export const activarEtapa = (db, IDSobreGrupo) => {
  return db.getFirstAsync(
    `SELECT subetapas.IDSubEtapa FROM subetapas WHERE IDSobreGrupo = ?`, [IDSobreGrupo]);
};




// Contar total filtrado (útil para saber si hay más páginas)
export const contarRenglonesFiltrados = async (db, tablaId) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );

  if (!filtro || !filtro.valor) {
    const row = await db.getFirstAsync('SELECT COUNT(*) as total FROM rvariantes');
    return row?.total ?? 0;
  }

  const patron = `%${filtro.valor}%`;
  const row = filtro.campo === 'rvariantes.IDSubGrupo'
    ? await db.getFirstAsync(
        'SELECT COUNT(*) AS total FROM rvariantes WHERE IDSubGrupo LIKE ?',
        `${filtro.valor}%`
      )
    : await db.getFirstAsync(
        'SELECT COUNT(*) AS total FROM rvariantes WHERE IDRVariante LIKE ? OR RVariante LIKE ?',
        patron,
        patron
      );
  return row?.total ?? 0;
};


export const obtenerRenglonesPaginados = (db,limite = 50, offset = 0) => {
  return db.getAllSync(
    'SELECT * FROM rvariantes ORDER BY IDRVariante ASC LIMIT ? OFFSET ?',
    [limite, offset]
  );
};

export const obtenerRenglonesFiltrados = async (db, tablaId, limite = 50, offset = 0) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );
  const consultaBase = `
    SELECT rvariantes.*,
           subgrupos.IDGrupo AS IDGrupo,
           subgrupos.SubGrupo,
           grupos.IDSobreGrupo AS IDSobreGrupo,
           grupos.Grupo,
           sobregrupos.SobreGrupo,
           unidadesmedidas.umedicion
    FROM rvariantes
    LEFT JOIN subgrupos ON subgrupos.IDSubGrupo = rvariantes.IDSubGrupo
    LEFT JOIN grupos ON grupos.IDGrupo = subgrupos.IDGrupo
    LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo
    LEFT JOIN unidadesmedidas ON unidadesmedidas.um = rvariantes.UM
  `;
  
  if (!filtro?.valor) {
    return db.getAllAsync(
      `${consultaBase} ORDER BY rvariantes.IDRVariante ASC LIMIT ? OFFSET ?`,
      limite,
      offset
    );
  }

  if (filtro.campo === 'rvariantes.IDSubGrupo') {
    return db.getAllAsync(
      `${consultaBase}
       WHERE rvariantes.IDSubGrupo LIKE ?
       ORDER BY rvariantes.IDRVariante ASC LIMIT ? OFFSET ?`,
      `${filtro.valor}%`,
      limite,
      offset
    );
  }

  const patron = `%${filtro.valor}%`;
  return db.getAllAsync(
    `${consultaBase}
     WHERE rvariantes.RVariante LIKE ? OR rvariantes.IDRVariante LIKE ?
     ORDER BY rvariantes.IDRVariante ASC LIMIT ? OFFSET ?`,
    patron,
    patron,
    limite,
    offset
  );
};

export const obtenerRenglonPorId = (db, id) => {
return db.getFirstAsync(
  `SELECT rvariantes.*,
          subgrupos.IDGrupo AS IDGrupo,
          subgrupos.SubGrupo,
          grupos.IDSobreGrupo AS IDSobreGrupo,
          grupos.Grupo,
          sobregrupos.SobreGrupo,
          unidadesmedidas.umedicion
   FROM rvariantes
   LEFT JOIN subgrupos ON subgrupos.IDSubGrupo = rvariantes.IDSubGrupo
   LEFT JOIN grupos ON grupos.IDGrupo = subgrupos.IDGrupo
   LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo
   LEFT JOIN unidadesmedidas ON unidadesmedidas.um = rvariantes.UM
   WHERE rvariantes.IDRVariante = ?
   LIMIT 1`,
  id
);
};

export const obtenerDetallesDelRenglon = (db, id) => {
     
    return db.getAllAsync(
      ` SELECT crvariantes.norma, recursos.*, recursotipos.tiporecurso,  unidadesmedidas.umedicion
        FROM crvariantes 
        LEFT JOIN recursos ON recursos.IDRecurso = crvariantes.IDRecurso 
        LEFT JOIN recursotipos ON recursotipos.idtiporecurso = recursos.Tipo 
        LEFT JOIN unidadesmedidas ON unidadesmedidas.um = recursos.UM 
        WHERE crvariantes.IDRVariante = ?
        ORDER BY crvariantes.IDRecurso
      `,
      id
    );  
  
  };



  

  ///// SECCIONES

  // Contar total filtrado (útil para saber si hay más páginas)
export const contarSeccionesFiltradas = (db,tablaId) => {
  const filtro = obtenerFiltro(db,tablaId);

  if (!filtro || !filtro.valor) {
    const row = db.getFirstSync('SELECT COUNT(*) as total FROM sobregrupos');
    return row ? row.total : 0;
  }

  const patron = `%${filtro.valor}%`;
  let row;
  if (filtro.campo == "*") {
    row = db.getFirstSync(
      'SELECT COUNT(*) as total FROM sobregrupos WHERE IDSobreGrupo LIKE ? OR SobreGrupo LIKE ?',
      [patron, patron]
    );
  } else if(filtro.campo == "sobregrupos.IDSobreGrupo") {
    row = db.getFirstSync(
      `SELECT COUNT(*) as total FROM sobregrupos WHERE ${filtro.campo} LIKE ?`,
      [`${filtro.valor}%`]
    );
  } else {
    row = db.getFirstSync(
      `SELECT COUNT(*) as total FROM sobregrupos WHERE ${filtro.campo} LIKE ?`,
      [patron]
    );
  }
  
  return row ? row.total : 0;
};


export const obtenerSeccionesFiltradas = (db,tablaId, limite = 50, offset = 0) => {
  const filtro = obtenerFiltro(db,tablaId);  
  
    if (!filtro || !filtro.valor) { 
      return db.getAllSync(
        ` SELECT sobregrupos.*
          FROM sobregrupos 
          ORDER BY IDSobreGrupo ASC LIMIT ? OFFSET ?
        `,
        [limite, offset]
      );
    }
  
    
    
  
    const patron = `%${filtro.valor}%`; 
    
    if (filtro.campo == "*") {
      return db.getAllSync(
        ` SELECT sobregrupos.*
          FROM sobregrupos           
          WHERE SobreGrupo LIKE ? OR IDSobreGrupo LIKE ? ORDER BY sobregrupos.IDSobreGrupo ASC LIMIT ? OFFSET ?`,
        [patron, patron, limite, offset]
      );
    } else if(filtro.campo == "sobregrupos.IDSobreGrupo") {
      
      return db.getAllSync(
        ` SELECT sobregrupos.*
          FROM sobregrupos 
          WHERE ${filtro.campo} LIKE ? ORDER BY sobregrupos.IDSobreGrupo ASC LIMIT ? OFFSET ?`,
        [`${filtro.valor}%`, limite, offset]
      );
    } else {      
        return db.getAllSync(
          ` SELECT sobregrupos.*
            FROM sobregrupos 
            WHERE ${filtro.campo} LIKE ? ORDER BY sobregrupos.IDSobreGrupo ASC LIMIT ? OFFSET ?`,
          [ patron, limite, offset]
        );     
    }


  };


  //CAPITULOS

  // Contar total filtrado (útil para saber si hay más páginas)
export const contarCapitulosFiltrados = async (db, tablaId) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );
  if (!filtro || !filtro.valor) {
    const row = await db.getFirstAsync('SELECT COUNT(*) as total FROM grupos');
    return row?.total ?? 0;
  }

  const patron = `%${filtro.valor}%`;
  const row = filtro.campo === 'grupos.IDSobreGrupo'
    ? await db.getFirstAsync(
        `SELECT COUNT(*) AS total
         FROM grupos
         WHERE grupos.IDSobreGrupo LIKE ?`,
        `${filtro.valor}%`
      )
    : await db.getFirstAsync(
        `SELECT COUNT(*) AS total FROM grupos
         WHERE IDGrupo LIKE ? OR Grupo LIKE ?`,
        patron,
        patron
      );
  return row?.total ?? 0;
};


export const obtenerCapitulosPaginados = (db,limite = 50, offset = 0) => {
  return db.getAllSync(
    'SELECT * FROM grupos ORDER BY IDGrupo ASC LIMIT ? OFFSET ?',
    [limite, offset]
  );
};

export const obtenerCapitulosFiltrados = async (db, tablaId, limite = 50, offset = 0) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );
    if (!filtro || !filtro.valor) {  
       
      return db.getAllAsync(
        ` SELECT grupos.*, sobregrupos.SobreGrupo
          FROM grupos 
          LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo 
          ORDER BY IDGrupo ASC LIMIT ? OFFSET ?
        `,
        limite,
        offset
      );
    }
    
    const patron = `%${filtro.valor}%`;     
    if (filtro.campo === 'grupos.IDSobreGrupo') {
      return db.getAllAsync(
        `SELECT grupos.*, sobregrupos.SobreGrupo
         FROM grupos
         LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo
         WHERE grupos.IDSobreGrupo LIKE ?
         ORDER BY grupos.IDGrupo ASC LIMIT ? OFFSET ?`,
        `${filtro.valor}%`,
        limite,
        offset
      );
    }
    return db.getAllAsync(
        ` SELECT grupos.*, sobregrupos.SobreGrupo 
        FROM grupos 
        LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo 
        WHERE grupo LIKE ? OR IDGrupo LIKE ? ORDER BY grupos.IDGrupo ASC LIMIT ? OFFSET ?`,
        patron,
        patron,
        limite,
        offset
      );
  };


  //SUBCAPITULOS

  // Contar total filtrado (útil para saber si hay más páginas)
export const contarSubCapitulosFiltrados = async (db, tablaId) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );
  if (!filtro || !filtro.valor) {
    const row = await db.getFirstAsync('SELECT COUNT(*) as total FROM subgrupos');
    return row?.total ?? 0;
  }

  const patron = `%${filtro.valor}%`;
  const row = filtro.campo === 'subgrupos.IDGrupo'
    ? await db.getFirstAsync(
        'SELECT COUNT(*) AS total FROM subgrupos WHERE IDGrupo LIKE ?',
        `${filtro.valor}%`
      )
    : await db.getFirstAsync(
        'SELECT COUNT(*) AS total FROM subgrupos WHERE IDSubGrupo LIKE ? OR SubGrupo LIKE ?',
        patron,
        patron
      );
  return row?.total ?? 0;
};


export const obtenerSubCapitulosPaginados = (db,limite = 50, offset = 0) => {
  return db.getAllSync(
    'SELECT * FROM subgrupos ORDER BY IDSubGrupo ASC LIMIT ? OFFSET ?',
    [limite, offset]
  );
};

export const obtenerSubCapitulosFiltrados = async (db, tablaId, limite = 50, offset = 0) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );
    if (!filtro || !filtro.valor) {         
      return db.getAllAsync(
        ` SELECT subgrupos.*, subgrupos.SubGrupo, grupos.Grupo , sobregrupos.SobreGrupo
          FROM subgrupos 
          LEFT JOIN grupos ON grupos.IDGrupo = subgrupos.IDGrupo 
          LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo 
          ORDER BY IDSubGrupo ASC LIMIT ? OFFSET ?
        `,
        limite,
        offset
      );
    }      
    const patron = `%${filtro.valor}%`;  
    if (filtro.campo === 'subgrupos.IDGrupo') {
      return db.getAllAsync(
        `SELECT subgrupos.*, subgrupos.SubGrupo, grupos.Grupo, sobregrupos.SobreGrupo
         FROM subgrupos
         LEFT JOIN grupos ON grupos.IDGrupo = subgrupos.IDGrupo
         LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo
         WHERE subgrupos.IDGrupo LIKE ?
         ORDER BY grupos.IDGrupo ASC LIMIT ? OFFSET ?`,
        `${filtro.valor}%`,
        limite,
        offset
      );
    }
    return db.getAllAsync(
        ` SELECT subgrupos.*, subgrupos.SubGrupo, grupos.Grupo , sobregrupos.SobreGrupo 
          FROM subgrupos 
          LEFT JOIN grupos ON grupos.IDGrupo = subgrupos.IDGrupo 
          LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo 
          WHERE subgrupo LIKE ? OR IDSubGrupo LIKE ? ORDER BY subgrupos.IDSubGrupo ASC LIMIT ? OFFSET ?`,
        patron,
        patron,
        limite,
        offset
      );
  };

//OBRAS

const columnasObra = [
  ['codigo', 'TEXT'],
  ['identidad', "TEXT NOT NULL DEFAULT 'obra'"],
  ['cantidadfisica', 'REAL NOT NULL DEFAULT 1'],
  ['p100utilidades', 'REAL NOT NULL DEFAULT 15'],
  ['p100impuestos', 'REAL NOT NULL DEFAULT 10'],
  ['p100vacaciones', 'REAL NOT NULL DEFAULT 9.09'],
  ['p100contribuciones', 'REAL NOT NULL DEFAULT 14'],
  ['p100gastos', 'REAL NOT NULL DEFAULT 1'],
  ['p100impuestosft', 'REAL NOT NULL DEFAULT 5'],
  ['p100osde', 'REAL NOT NULL DEFAULT 0'],
  ['contribucionespecial', 'REAL NOT NULL DEFAULT 0'],
  ['argumentacion', 'TEXT'],
  ['precio', 'REAL NOT NULL DEFAULT 0'],
  ['elaboradopor_id', 'INTEGER'],
  ['aprobadopor_id', 'INTEGER'],
  ['actividadtipo_id', 'INTEGER'],
  ['user_id', 'INTEGER NOT NULL DEFAULT 1'],
];

const tablasObraAnteriores = [
  ['servicios', 'obras'],
  ['serviciopartidas', 'obrapartidas'],
  ['serviciosubpartidas', 'obrasubpartidas'],
  ['serviciorhumanos', 'obrarhumanos'],
  ['servicioequipos', 'obraequipos'],
  ['servicioinsumos', 'obrainsumos'],
  ['tempservicioinsumos', 'tempobrainsumos'],
];

const columnasObraAnteriores = [
  ['obras', 'servicio', 'obra'],
  ['generales', 'servicio_activo', 'obra_activa'],
  ['listadodecantidades', 'servicio_id', 'obra_id'],
  ['obrapartidas', 'servicio_id', 'obra_id'],
  ['obrasubpartidas', 'servicio_id', 'obra_id'],
  ['obrarhumanos', 'servicio_id', 'obra_id'],
  ['obraequipos', 'servicio_id', 'obra_id'],
  ['obrainsumos', 'servicio_id', 'obra_id'],
  ['tempobrainsumos', 'servicio_id', 'obra_id'],
  ['cronogramas', 'serviciorhumano_id', 'obrarhumano_id'],
];

export const migrarObras = async (db) => {
  await db.withTransactionAsync(async () => {
    for (const [tablaAnterior, tablaNueva] of tablasObraAnteriores) {
      const anterior = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        tablaAnterior
      );
      const nueva = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        tablaNueva
      );

      if (anterior && nueva) {
        throw new Error(`Existen las tablas ${tablaAnterior} y ${tablaNueva}; no se puede migrar sin riesgo de pérdida de datos.`);
      }
      if (anterior) {
        await db.execAsync(`ALTER TABLE ${tablaAnterior} RENAME TO ${tablaNueva}`);
      }
    }

    const tablaObras = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'obras'"
    );
    if (!tablaObras) {
      throw new Error('No existe la tabla obras en la base de datos.');
    }

    for (const [tabla, nombreAnterior, nombreNuevo] of columnasObraAnteriores) {
      const tablaExiste = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        tabla
      );
      if (!tablaExiste) continue;

      const columnas = await db.getAllAsync(`PRAGMA table_info(${tabla})`);
      const nombres = new Set(columnas.map(({ name }) => name));
      if (nombres.has(nombreAnterior) && nombres.has(nombreNuevo)) {
        throw new Error(`La tabla ${tabla} contiene las columnas ${nombreAnterior} y ${nombreNuevo}; no se puede migrar sin riesgo de pérdida de datos.`);
      }
      if (nombres.has(nombreAnterior)) {
        await db.execAsync(
          `ALTER TABLE ${tabla} RENAME COLUMN ${nombreAnterior} TO ${nombreNuevo}`
        );
      }
    }

    const columnasExistentes = await db.getAllAsync('PRAGMA table_info(obras)');
    const nombresExistentes = new Set(columnasExistentes.map(({ name }) => name));
    const columnasPendientes = columnasObra.filter(([nombre]) => !nombresExistentes.has(nombre));
    for (const [nombre, tipo] of columnasPendientes) {
      await db.execAsync(`ALTER TABLE obras ADD COLUMN ${nombre} ${tipo}`);
    }

    await db.runAsync("UPDATE obras SET identidad = 'obra' WHERE identidad = 'servicio'");
    await db.runAsync("UPDATE filtros SET tabla_id = 'OB' WHERE tabla_id = 'SV'");
  });
};


export const obtenerObras = (db) => {
  return db.getAllAsync(
    `SELECT obras.*, generales.obra_activa
    FROM obras 
    LEFT JOIN generales ON generales.obra_activa = obras.id
    ORDER BY obras.obra
    `);
};

export const obtenerObraActiva = (db) => {
  return db.getFirstAsync(
    `SELECT obras.*
    FROM obras
    INNER JOIN generales ON generales.obra_activa = obras.id
    ORDER BY generales.id
    LIMIT 1
    `);
};

export const establecerObraActiva = (db, obra_id) => {
  return db.runAsync(
    `UPDATE generales SET 
      obra_activa=?
      `,
    [obra_id]
  );
}

// Contar total filtrado (útil para saber si hay más páginas)
export const contarObrasFiltradas = async (db, tablaId) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );

  if (!filtro || !filtro.valor) {
    const row = await db.getFirstAsync('SELECT COUNT(*) as total FROM obras');
    return row?.total ?? 0;
  }

  const patron = `%${filtro.valor}%`;
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS total
     FROM obras
     LEFT JOIN clientes ON clientes.id = obras.cliente_id
     WHERE obras.obra LIKE ?
        OR obras.codigo LIKE ?
        OR clientes.cliente LIKE ?`,
    patron,
    patron,
    patron
  );
  return row?.total ?? 0;
};


export const obtenerObrasFiltradas = async (db, tablaId, limite = 50, offset = 0) => {
  const filtro = await db.getFirstAsync(
    'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
    tablaId
  );
  const consultaBase = `
    SELECT obras.*, generales.obra_activa,
           clientes.cliente,
           COALESCE(cantidades.objetos, 0) AS objetos_asignados,
           COALESCE(cantidades.renglones, 0) AS renglones_asignados,
           COALESCE(cantidades.precio, 0) AS precio_asignado
    FROM obras
    LEFT JOIN generales ON generales.obra_activa = obras.id
    LEFT JOIN clientes ON clientes.id = obras.cliente_id
    LEFT JOIN (
      SELECT obra_id,
             COUNT(DISTINCT objetodeobra_id) AS objetos,
             COUNT(*) AS renglones,
             SUM(CAST(cantidad AS REAL) * CAST(precio AS REAL)) AS precio
      FROM listadodecantidades
      GROUP BY obra_id
    ) cantidades ON cantidades.obra_id = obras.id
  `;
  
    if (!filtro || !filtro.valor) { 
      return db.getAllAsync(
        `${consultaBase}
         ORDER BY obras.obra ASC LIMIT ? OFFSET ?`,
        limite,
        offset
      );
    }
  
    
    
  
    const patron = `%${filtro.valor}%`;
    return db.getAllAsync(
      `${consultaBase}
       WHERE obras.obra LIKE ?
          OR obras.codigo LIKE ?
          OR clientes.cliente LIKE ?
       ORDER BY obras.obra ASC LIMIT ? OFFSET ?`,
      patron,
      patron,
      patron,
      limite,
      offset
    );

  };

export const agregarRCalObra = async (
  db,
  obra_id,
  IDSubEtapa,
  objetodeobra_id,
  IDRVariante,
  cantidad,
  precio,
  observaciones,
  IDRecurso = null
) => {
  return db.runAsync(
    `INSERT INTO listadodecantidades
      (obra_id, objetodeobra_id, IDRVariante, cantidad, precio, observaciones, IDRecurso, IDSubEtapa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    obra_id, objetodeobra_id, IDRVariante, cantidad, precio, observaciones, IDRecurso, IDSubEtapa
  );
}

export const obtenerRenglonesAsignados = (db, obraId) => {
  return db.getAllAsync(
    `SELECT listadodecantidades.id AS asignacion_id,
            listadodecantidades.objetodeobra_id,
            listadodecantidades.IDRVariante,
            listadodecantidades.IDSubEtapa,
            listadodecantidades.cantidad,
            listadodecantidades.precio,
            listadodecantidades.observaciones,
            COALESCE(recursos.IDRecurso, listadodecantidades.IDRecurso) AS IDRecurso,
            objetosdeobras.objetodeobra,
            rvariantes.RVariante,
            rvariantes.UM,
            unidadesmedidas.umedicion,
            recursos.Recurso AS suministro_nombre,
            recursotipos.tiporecurso AS suministro_tipo,
            suministro_unidades.umedicion AS suministro_unidad,
            recursos.Precio AS suministro_precio,
            sobregrupos.SobreGrupo,
            subetapas.SubEtapa,
            grupos.Grupo,
            subgrupos.SubGrupo
     FROM listadodecantidades
     LEFT JOIN objetosdeobras ON objetosdeobras.id = listadodecantidades.objetodeobra_id
     LEFT JOIN rvariantes ON rvariantes.IDRVariante = listadodecantidades.IDRVariante
     LEFT JOIN unidadesmedidas ON unidadesmedidas.um = rvariantes.UM
     LEFT JOIN recursos ON recursos.IDRecurso = listadodecantidades.IDRecurso
     LEFT JOIN subetapas ON subetapas.IDSubEtapa = listadodecantidades.IDSubEtapa
     LEFT JOIN recursotipos ON recursotipos.idtiporecurso = recursos.Tipo
     LEFT JOIN unidadesmedidas AS suministro_unidades ON suministro_unidades.um = recursos.UM
     LEFT JOIN subgrupos ON subgrupos.IDSubGrupo = rvariantes.IDSubGrupo
     LEFT JOIN grupos ON grupos.IDGrupo = subgrupos.IDGrupo
     LEFT JOIN sobregrupos ON sobregrupos.IDSobreGrupo = grupos.IDSobreGrupo
     WHERE listadodecantidades.obra_id = ?
     ORDER BY 
              listadodecantidades.objetodeobra_id ASC,
              listadodecantidades.IDRVariante ASC,
              listadodecantidades.rowid ASC`,
    obraId
  );
};

export const eliminarObjetosDeLaObra = (db, obraId, objetoDeObraId) => {
  return db.runAsync(
    `DELETE FROM listadodecantidades
     WHERE obra_id = ? AND objetodeobra_id = ?`,
    obraId,
    objetoDeObraId
  );
};

export const eliminarRenglonAsignado = (db, obraId, asignacionId) => {
  return db.runAsync(
    `DELETE FROM listadodecantidades
     WHERE obra_id = ? AND id = ?`,
    obraId,
    asignacionId
  );
};




//SUMINISTROS

const tiposPermitidosSuministro = [
  'MATERIAL',
  'MATERIALES',
  'JUEGO',
  'JUEGOS',
  'SEMIELABORADO',
  'SEMIELABORADOS',
];

const crearCondicionSuministros = (filtro = '') => {
  const filtroNormalizado = filtro.trim();
  const tiposSql = tiposPermitidosSuministro.map(() => '?').join(', ');

  if (!filtroNormalizado) {
    return {
      sql: `WHERE UPPER(TRIM(COALESCE(recursotipos.tiporecurso, ''))) IN (${tiposSql})`,
      parametros: tiposPermitidosSuministro,
    };
  }

  const patron = `%${filtroNormalizado}%`;
  return {
    sql: `WHERE UPPER(TRIM(COALESCE(recursotipos.tiporecurso, ''))) IN (${tiposSql})
           AND (recursos.IDRecurso LIKE ? OR recursos.Recurso LIKE ? OR recursotipos.tiporecurso LIKE ?)`,
    parametros: [...tiposPermitidosSuministro, patron, patron, patron],
  };
};

export const obtenerSuministros = async (db, limite = 50, offset = 0, filtro = '') => {
  const { sql, parametros } = crearCondicionSuministros(filtro);
  const queryParametros = [...parametros, limite, offset];

  return db.getAllAsync(
    `SELECT recursos.IDRecurso,
            recursos.Recurso,
            recursos.Tipo,
            recursos.UM,
            recursos.Precio,
            recursos.Peso,
            recursos.PMerma,
            recursos.Activo,
            recursotipos.tiporecurso,
            unidadesmedidas.umedicion
    FROM recursos
    LEFT JOIN recursotipos ON recursotipos.idtiporecurso = recursos.Tipo
    LEFT JOIN unidadesmedidas ON unidadesmedidas.um = recursos.UM
    ${sql}
    ORDER BY (recursos.Recurso IS NULL OR TRIM(recursos.Recurso) = '') ASC,
             recursos.Recurso COLLATE NOCASE,
             recursos.IDRecurso
    LIMIT ? OFFSET ?`,
    ...queryParametros
  );
};

export const contarSuministros = async (db, filtro = '') => {
  const { sql, parametros } = crearCondicionSuministros(filtro);
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS total
     FROM recursos
     LEFT JOIN recursotipos ON recursotipos.idtiporecurso = recursos.Tipo
     ${sql}`,
    ...parametros
  );
  return row?.total ?? 0;
};