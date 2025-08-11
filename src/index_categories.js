const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
const tiposDocumentos = require('./json/tipos_documentos.json');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function indexCategories() {
  try {
    // Carga el embedder (puedes cambiarlo por otro modelo si quieres)
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    for (let categoria of tiposDocumentos) {
      // Usa la descripción para crear embedding
      const embeddingTensor = await embedder(categoria.descripcion, { pooling: 'mean', normalize: true });
      const embedding = Array.from(embeddingTensor.data);

      // Inserta o actualiza en Supabase
      const { data, error } = await supabase
        .from('categorias')
        .upsert({
          id: categoria.id,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          embedding: embedding,
        }, { onConflict: 'id' });

      if (error) {
        console.error(`Error insertando categoria ${categoria.nombre}:`, error);
      } else {
        console.log(`✅ Categoría indexada: ${categoria.nombre}`);
      }
    }

    console.log('✅ Todas las categorías fueron indexadas en Supabase.');
  } catch (err) {
    console.error('Error general:', err);
  }
}

indexCategories();
