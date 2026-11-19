import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DOCS.mkdir(parents=True, exist_ok=True)
DIAGRAM_PATH = DOCS / "diagrama-entidad-relacion.png"
DOCX_PATH = Path(
    os.environ.get("DOCUMENT_OUTPUT_PATH", DOCS / "Documentacion_CajaClara.docx")
)

FOREST = "173F2E"
FOREST_DARK = "0F2D21"
PALE_GREEN = "EEF5ED"
LIGHT_GREEN = "D9F09A"
CORAL = "B64732"
BLACK = "000000"
GRAY = "657168"
LIGHT_GRAY = "D9D9D9"
WHITE = "FFFFFF"


def font(path: str, size: int):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def build_er_diagram():
    image = Image.new("RGB", (1600, 900), "#F7F9F6")
    draw = ImageDraw.Draw(image)
    title_font = font("C:/Windows/Fonts/arialbd.ttf", 38)
    entity_font = font("C:/Windows/Fonts/arialbd.ttf", 34)
    body_font = font("C:/Windows/Fonts/arial.ttf", 27)
    small_font = font("C:/Windows/Fonts/arialbd.ttf", 24)

    draw.text((90, 58), "Modelo de datos de CajaClara", fill="#17211B", font=title_font)
    draw.text(
        (90, 112),
        "Cada usuario administra su propio inventario de productos.",
        fill="#657168",
        font=body_font,
    )

    def entity_box(x, y, w, h, name, fields):
        draw.rounded_rectangle((x, y, x + w, y + h), radius=26, fill="#FFFFFF", outline="#C9D5CA", width=3)
        draw.rounded_rectangle((x, y, x + w, y + 92), radius=26, fill="#173F2E")
        draw.rectangle((x, y + 66, x + w, y + 92), fill="#173F2E")
        draw.text((x + 32, y + 25), name, fill="#FFFFFF", font=entity_font)
        row_y = y + 125
        for field_name, field_type, marker in fields:
            marker_fill = "#B64732" if marker in {"PK", "FK"} else "#657168"
            draw.text((x + 32, row_y), marker, fill=marker_fill, font=small_font)
            draw.text((x + 104, row_y), field_name, fill="#17211B", font=body_font)
            type_width = draw.textlength(field_type, font=body_font)
            draw.text((x + w - type_width - 32, row_y), field_type, fill="#657168", font=body_font)
            row_y += 58

    user_fields = [
        ("_id", "ObjectId", "PK"),
        ("name", "String", ""),
        ("email", "String", "UQ"),
        ("password", "String", ""),
        ("createdAt", "Date", ""),
        ("updatedAt", "Date", ""),
    ]
    product_fields = [
        ("_id", "ObjectId", "PK"),
        ("owner", "ObjectId", "FK"),
        ("name", "String", ""),
        ("sku", "String", "UQ"),
        ("category", "String", ""),
        ("price", "Number", ""),
        ("stock", "Number", ""),
        ("status", "String", ""),
    ]

    entity_box(90, 230, 540, 465, "Usuario", user_fields)
    entity_box(970, 170, 540, 585, "Producto", product_fields)

    line_y = 462
    draw.line((630, line_y, 970, line_y), fill="#173F2E", width=6)
    draw.ellipse((624, line_y - 9, 642, line_y + 9), fill="#173F2E")
    draw.line((946, line_y - 26, 970, line_y), fill="#173F2E", width=6)
    draw.line((946, line_y + 26, 970, line_y), fill="#173F2E", width=6)
    draw.line((946, line_y, 970, line_y), fill="#173F2E", width=6)
    draw.text((650, line_y - 58), "1", fill="#B64732", font=small_font)
    draw.text((922, line_y - 58), "N", fill="#B64732", font=small_font)
    relation = "administra"
    relation_width = draw.textlength(relation, font=body_font)
    draw.rounded_rectangle((760 - relation_width / 2 - 18, line_y - 27, 760 + relation_width / 2 + 18, line_y + 27), radius=18, fill="#D9F09A")
    draw.text((760 - relation_width / 2, line_y - 17), relation, fill="#173F2E", font=body_font)

    draw.rounded_rectangle((90, 790, 1510, 850), radius=18, fill="#EEF5ED")
    draw.text((120, 806), "Regla principal  El par owner y sku es único para evitar productos duplicados dentro de una cuenta.", fill="#173F2E", font=body_font)
    image.save(DIAGRAM_PATH, quality=95)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color=LIGHT_GRAY, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=110, start=120, bottom=110, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_row_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    cant_split.set(qn("w:val"), "true")
    tr_pr.append(cant_split)


def add_page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instruction, separate, text, end])


def set_column_width(cell, width_inches):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(width_inches * 1440)))
    tc_w.set(qn("w:type"), "dxa")


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    header_row = table.rows[0]
    set_repeat_table_header(header_row)
    set_row_cant_split(header_row)
    for index, header in enumerate(headers):
        cell = header_row.cells[index]
        cell.text = str(header)
        set_cell_shading(cell, FOREST)
        set_cell_border(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        if widths:
            set_column_width(cell, widths[index])
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if index == 0 else WD_ALIGN_PARAGRAPH.LEFT
        for run in paragraph.runs:
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.bold = True
            run.font.size = Pt(9.5)

    for row_index, values in enumerate(rows):
        row = table.add_row()
        set_row_cant_split(row)
        cells = row.cells
        for index, value in enumerate(values):
            cell = cells[index]
            cell.text = str(value)
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if widths:
                set_column_width(cell, widths[index])
            if row_index % 2 == 1:
                set_cell_shading(cell, PALE_GREEN)
            paragraph = cell.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if index == 0 else WD_ALIGN_PARAGRAPH.LEFT
            for run in paragraph.runs:
                run.font.size = Pt(9.2)
                run.font.color.rgb = RGBColor(23, 33, 27)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_bullet(doc, text, level=0):
    paragraph = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    paragraph.add_run(text)
    return paragraph


def add_number(doc, text):
    paragraph = doc.add_paragraph(style="List Number")
    paragraph.add_run(text)
    return paragraph


def add_heading(doc, text, level=1):
    paragraph = doc.add_heading(text, level=level)
    paragraph.paragraph_format.left_indent = Inches(0)
    paragraph.paragraph_format.right_indent = Inches(0)
    paragraph.paragraph_format.first_line_indent = Inches(0)
    paragraph.paragraph_format.keep_with_next = True
    return paragraph


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    relationship_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), relationship_id)
    run = OxmlElement("w:r")
    properties = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), FOREST)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    properties.extend([color, underline])
    run.append(properties)
    text_node = OxmlElement("w:t")
    text_node.text = text
    run.append(text_node)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def configure_styles(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(23, 33, 27)
    normal.paragraph_format.space_after = Pt(7)
    normal.paragraph_format.line_spacing = 1.12

    title = styles["Title"]
    title.font.name = "Arial"
    title.font.size = Pt(28)
    title.font.bold = True
    title.font.color.rgb = RGBColor(0, 0, 0)
    title.paragraph_format.space_after = Pt(12)
    title_properties = title.element.get_or_add_pPr()
    title_border = title_properties.find(qn("w:pBdr"))
    if title_border is not None:
        title_properties.remove(title_border)

    for style_name, size in (("Heading 1", 17), ("Heading 2", 13), ("Heading 3", 11)):
        style = styles[style_name]
        style.font.name = "Arial"
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.space_before = Pt(14 if style_name == "Heading 1" else 9)
        style.paragraph_format.space_after = Pt(6)
        style.paragraph_format.keep_with_next = True

    for style_name in ("List Bullet", "List Bullet 2", "List Number"):
        style = styles[style_name]
        style.font.name = "Arial"
        style.font.size = Pt(10.5)
        style.font.color.rgb = RGBColor(23, 33, 27)
        style.paragraph_format.space_after = Pt(4)


def configure_document(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.72)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.78)
    section.right_margin = Inches(0.78)

    footer = section.footer
    footer_paragraph = footer.paragraphs[0]
    footer_paragraph.paragraph_format.tab_stops.add_tab_stop(
        Inches(6.94), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES
    )
    footer_label = footer_paragraph.add_run("CajaClara  Actividad 4")
    footer_label.font.color.rgb = RGBColor(101, 113, 104)
    footer_label.font.size = Pt(8.5)
    footer_paragraph.add_run("\t")
    add_page_number(footer_paragraph)
    if footer_paragraph.runs:
        footer_paragraph.runs[-1].font.color.rgb = RGBColor(101, 113, 104)
        footer_paragraph.runs[-1].font.size = Pt(8.5)


def build_document():
    doc = Document()
    configure_document(doc)
    configure_styles(doc)
    doc.core_properties.title = "Documentación técnica de CajaClara"
    doc.core_properties.subject = "Actividad 4 Aplicación web con Node.js Express MongoDB y Jest"
    doc.core_properties.author = "Estudiante"

    brand = doc.add_paragraph()
    brand.paragraph_format.space_after = Pt(44)
    run = brand.add_run("CAJACLARA")
    run.font.name = "Arial"
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(23, 63, 46)
    run.font.letter_spacing = Pt(1.2)

    title = doc.add_paragraph(style="Title")
    title.add_run("Documentación técnica de CajaClara")
    subtitle = doc.add_paragraph()
    subtitle.add_run("Actividad 4  Aplicación web con Node.js Express MongoDB y Jest").bold = True
    subtitle.runs[0].font.size = Pt(13)
    subtitle.runs[0].font.color.rgb = RGBColor(101, 113, 104)
    subtitle.paragraph_format.space_after = Pt(28)

    intro = doc.add_paragraph()
    intro.add_run(
        "En este documento explico la aplicación que desarrollé para administrar productos de un negocio que prepara cajas de regalo personalizadas. "
        "Implementé registro e inicio de sesión, protección con JWT, un CRUD de productos, pruebas unitarias y un despliegue continuo funcional."
    )
    intro.paragraph_format.space_after = Pt(28)

    metadata = [
        ("Proyecto", "CajaClara"),
        ("Tipo de solución", "Aplicación web de inventario"),
        ("Tecnologías", "Node.js, Express.js, MongoDB Atlas y Jest"),
        ("Plataforma elegida", "Vercel"),
        ("Fecha", "19 de noviembre de 2026"),
    ]
    add_table(doc, ["Dato", "Descripción"], metadata, widths=[1.8, 5.0])

    conclusion = doc.add_paragraph()
    conclusion.paragraph_format.space_before = Pt(24)
    conclusion.add_run("Resultado principal  ").bold = True
    conclusion.add_run(
        "El proyecto está publicado en Vercel, conectado a MongoDB Atlas y protegido con variables de entorno. "
        "GitHub Actions ejecuta las pruebas y publica la versión de producción de forma automática."
    )

    doc.add_page_break()
    add_heading(doc, "Descripción y alcance", 1)
    doc.add_paragraph(
        "Elegí un inventario para cajas de regalo porque el CRUD tiene un uso claro: un negocio puede registrar los insumos que ofrece, saber cuántas unidades tiene y mantener sus precios actualizados. "
        "La actividad se conserva dentro de su alcance académico, pero la interfaz y el modelo de datos permiten presentar una primera versión funcional a un cliente potencial."
    )
    doc.add_paragraph(
        "Cada usuario trabaja con su propio catálogo. La aplicación no muestra productos de otras cuentas y verifica el propietario en todas las consultas, actualizaciones y eliminaciones. "
        "También añadí búsqueda por nombre o SKU, filtro por categoría y un indicador de existencia baja."
    )

    add_heading(doc, "Objetivo del sistema", 2)
    doc.add_paragraph(
        "Mi objetivo fue desarrollar una aplicación web segura que permita registrar usuarios y administrar productos almacenados en MongoDB mediante operaciones CRUD. "
        "También busqué automatizar las pruebas y el despliegue para reducir errores al publicar nuevas versiones."
    )

    add_heading(doc, "Personas usuarias", 2)
    add_bullet(doc, "Propietaria o propietario de un negocio pequeño que prepara regalos personalizados.")
    add_bullet(doc, "Persona encargada de registrar existencias, precios y categorías de productos.")
    add_bullet(doc, "Docente o evaluador que necesita revisar el funcionamiento, las pruebas y el despliegue.")

    add_heading(doc, "Alcance incluido", 2)
    add_bullet(doc, "Registro, inicio de sesión, consulta de perfil y cierre de sesión en el navegador.")
    add_bullet(doc, "Creación, consulta, edición y eliminación de productos propios.")
    add_bullet(doc, "Validación de datos, manejo de errores y protección de rutas mediante JWT.")
    add_bullet(doc, "Pruebas unitarias, pipeline de GitHub Actions y configuración para Vercel.")

    doc.add_page_break()
    add_heading(doc, "Requerimientos funcionales", 1)
    doc.add_paragraph(
        "Los siguientes requerimientos describen lo que la aplicación debe permitir. Los redacté con un criterio de aceptación para que cada función pueda comprobarse."
    )
    functional_rows = [
        ("RF 01", "Registrar una cuenta", "El sistema guarda nombre, correo normalizado y contraseña protegida cuando los datos son válidos."),
        ("RF 02", "Evitar correos duplicados", "El sistema responde con 409 cuando el correo ya está registrado."),
        ("RF 03", "Iniciar sesión", "El sistema entrega un JWT cuando el correo y la contraseña coinciden."),
        ("RF 04", "Consultar la sesión", "Una persona autenticada puede consultar su nombre y correo mediante una ruta protegida."),
        ("RF 05", "Cerrar sesión", "La interfaz elimina el token local y regresa a la pantalla de acceso."),
        ("RF 06", "Agregar productos", "El usuario guarda nombre, SKU, categoría, precio, existencia, descripción y estado."),
        ("RF 07", "Listar productos propios", "La consulta devuelve únicamente los productos cuyo propietario coincide con el JWT."),
        ("RF 08", "Consultar un producto", "El sistema obtiene un producto por id sólo cuando pertenece al usuario autenticado."),
        ("RF 09", "Modificar productos", "El usuario actualiza campos permitidos sin cambiar el propietario del registro."),
        ("RF 10", "Eliminar productos", "El usuario elimina un producto propio y recibe una confirmación."),
        ("RF 11", "Buscar y filtrar", "La interfaz filtra por nombre, SKU o categoría sin exponer otros inventarios."),
        ("RF 12", "Mostrar resumen", "El panel calcula productos activos, unidades visibles y existencias bajas."),
        ("RF 13", "Informar el estado", "La ruta de salud indica si el servicio puede conectarse a MongoDB."),
    ]
    add_table(doc, ["ID", "Requerimiento", "Criterio de aceptación"], functional_rows, widths=[0.8, 2.0, 4.0])

    doc.add_page_break()
    add_heading(doc, "Requerimientos no funcionales", 1)
    doc.add_paragraph(
        "Además de las funciones visibles, definí condiciones de seguridad, rendimiento y mantenimiento que orientan la implementación."
    )
    nonfunctional_rows = [
        ("RNF 01", "Seguridad", "Las contraseñas se almacenan con bcrypt y nunca se devuelven en las respuestas."),
        ("RNF 02", "Autorización", "Las rutas de productos exigen un JWT válido y verifican el propietario."),
        ("RNF 03", "Privacidad", "Los secretos se administran con variables de entorno y no se incluyen en Git."),
        ("RNF 04", "Validación", "Las rutas rechazan datos incompletos, fuera de rango o con formato incorrecto."),
        ("RNF 05", "Disponibilidad", "El servidor informa errores de conexión sin revelar credenciales o trazas internas."),
        ("RNF 06", "Rendimiento", "El listado admite paginación y limita cada consulta a 100 registros."),
        ("RNF 07", "Usabilidad", "La interfaz se adapta a computadora y teléfono y utiliza etiquetas accesibles."),
        ("RNF 08", "Compatibilidad", "El proyecto requiere Node.js 22.13 o posterior y navegadores modernos."),
        ("RNF 09", "Mantenimiento", "La solución separa rutas, controladores, modelos, validadores y middleware."),
        ("RNF 10", "Calidad", "Cada cambio en main ejecuta Jest antes del despliegue."),
        ("RNF 11", "Observabilidad", "La aplicación ofrece una ruta de salud y registra errores internos en el servidor."),
        ("RNF 12", "Recuperación", "El pipeline cancela despliegues anteriores del mismo branch y conserva el historial de Git."),
    ]
    add_table(doc, ["ID", "Atributo", "Condición"], nonfunctional_rows, widths=[0.8, 1.5, 4.5])

    doc.add_page_break()
    add_heading(doc, "Modelo de datos", 1)
    doc.add_paragraph(
        "Utilicé dos entidades principales. Usuario representa la cuenta autenticada y Producto representa cada elemento del inventario. "
        "La relación es de uno a muchos porque una cuenta puede administrar varios productos y cada producto pertenece a una sola cuenta."
    )
    picture = doc.add_paragraph()
    picture.alignment = WD_ALIGN_PARAGRAPH.CENTER
    diagram_shape = picture.add_run().add_picture(str(DIAGRAM_PATH), width=Inches(6.75))
    diagram_shape._inline.docPr.set(
        "descr",
        "Diagrama entidad relación con Usuario en una relación de uno a muchos con Producto.",
    )
    diagram_shape._inline.docPr.set("title", "Diagrama entidad relación de CajaClara")
    caption = doc.add_paragraph("Figura 1  Diagrama entidad relación de CajaClara")
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption.runs[0].font.size = Pt(9)
    caption.runs[0].font.italic = True
    caption.runs[0].font.color.rgb = RGBColor(101, 113, 104)

    add_heading(doc, "Entidad Usuario", 2)
    user_rows = [
        ("_id", "ObjectId", "Llave primaria generada por MongoDB."),
        ("name", "String", "Nombre de la persona usuaria."),
        ("email", "String", "Correo normalizado y único."),
        ("password", "String", "Hash de la contraseña con bcrypt."),
        ("createdAt", "Date", "Fecha de creación automática."),
        ("updatedAt", "Date", "Fecha de actualización automática."),
    ]
    add_table(doc, ["Campo", "Tipo", "Descripción"], user_rows, widths=[1.3, 1.3, 4.2])

    add_heading(doc, "Entidad Producto", 2)
    product_rows = [
        ("_id", "ObjectId", "Llave primaria generada por MongoDB."),
        ("owner", "ObjectId", "Llave foránea que relaciona el producto con Usuario."),
        ("name", "String", "Nombre comercial del producto."),
        ("sku", "String", "Código único dentro de la cuenta."),
        ("description", "String", "Descripción opcional de hasta 500 caracteres."),
        ("category", "String", "Categoría controlada por una lista permitida."),
        ("price", "Number", "Precio unitario igual o mayor a cero."),
        ("stock", "Number", "Cantidad entera igual o mayor a cero."),
        ("status", "String", "Estado active o archived."),
        ("createdAt", "Date", "Fecha de creación automática."),
        ("updatedAt", "Date", "Fecha de actualización automática."),
    ]
    add_table(doc, ["Campo", "Tipo", "Descripción"], product_rows, widths=[1.3, 1.3, 4.2])

    doc.add_page_break()
    add_heading(doc, "Arquitectura y seguridad", 1)
    doc.add_paragraph(
        "Organicé el proyecto por responsabilidades. La interfaz envía solicitudes HTTP a las rutas de Express. Los validadores revisan el cuerpo y los parámetros, el middleware JWT identifica al usuario y los controladores consultan los modelos de Mongoose. "
        "Esta separación facilita las pruebas y evita concentrar toda la lógica en un solo archivo."
    )
    architecture_rows = [
        ("public", "Interfaz HTML, CSS y JavaScript que consume la API."),
        ("routes", "Define endpoints, métodos HTTP, validaciones y autenticación."),
        ("controllers", "Ejecuta los casos de uso de autenticación y productos."),
        ("middleware", "Protege rutas, valida solicitudes y centraliza errores."),
        ("models", "Define las reglas persistentes de Usuario y Producto."),
        ("config", "Administra la conexión reutilizable a MongoDB Atlas."),
        ("tests", "Comprueba rutas y controladores con Jest, Supertest y mocks."),
        ("api", "Expone la aplicación como función de Node.js en Vercel."),
    ]
    add_table(doc, ["Componente", "Responsabilidad"], architecture_rows, widths=[1.7, 5.1])

    add_heading(doc, "Medidas implementadas", 2)
    add_bullet(doc, "Firmé los tokens con una clave privada y configuré su expiración.")
    add_bullet(doc, "Apliqué bcrypt con factor de costo 12 antes de guardar contraseñas.")
    add_bullet(doc, "Limité los intentos de autenticación a 30 solicitudes por 15 minutos en producción.")
    add_bullet(doc, "Usé Helmet para encabezados de seguridad y una política de contenido restrictiva.")
    add_bullet(doc, "Validé identificadores de MongoDB, rangos numéricos, categorías y longitud de textos.")
    add_bullet(doc, "Filtré todas las operaciones de productos con el id del usuario autenticado.")
    add_bullet(doc, "Mantuve las credenciales fuera del repositorio mediante variables de entorno.")

    add_heading(doc, "Respuestas de error", 2)
    error_rows = [
        ("400", "Identificador o solicitud con formato incorrecto."),
        ("401", "Token ausente, inválido o vencido."),
        ("404", "Ruta o producto propio no encontrado."),
        ("409", "Correo o SKU duplicado."),
        ("422", "Datos que no cumplen las reglas de validación."),
        ("500", "Error interno no previsto."),
        ("503", "Conexión a la base de datos no disponible."),
    ]
    add_table(doc, ["Código", "Uso"], error_rows, widths=[1.2, 5.6])

    add_heading(doc, "Pruebas y resultados", 1)
    doc.add_paragraph(
        "Escribí pruebas unitarias con Jest y Supertest. Usé mocks para evitar depender de una base real y para comprobar de manera controlada cómo responden las rutas. "
        "La ejecución final aprobó 16 de 16 pruebas y alcanzó 82.75 por ciento de cobertura de sentencias."
    )
    test_rows = [
        ("Autenticación", "Registro inválido", "Rechaza datos incompletos con 422.", "Aprobada"),
        ("Autenticación", "Registro válido", "Crea la cuenta y devuelve un JWT.", "Aprobada"),
        ("Autenticación", "Correo duplicado", "Responde con 409.", "Aprobada"),
        ("Autenticación", "Login", "Acepta credenciales correctas y rechaza las incorrectas.", "Aprobada"),
        ("Autorización", "Perfil protegido", "Bloquea la solicitud sin token y permite un JWT válido.", "Aprobada"),
        ("Productos", "Listado", "Filtra por propietario autenticado.", "Aprobada"),
        ("Productos", "Creación", "Asigna el propietario y valida precio y existencia.", "Aprobada"),
        ("Productos", "Consulta", "Obtiene un producto propio por id.", "Aprobada"),
        ("Productos", "Actualización", "Actualiza sólo campos permitidos.", "Aprobada"),
        ("Productos", "Eliminación", "Elimina el producto dentro de la cuenta.", "Aprobada"),
        ("Productos", "Id inválido", "Rechaza el identificador antes de consultar MongoDB.", "Aprobada"),
    ]
    add_table(doc, ["Área", "Caso", "Resultado esperado", "Estado"], test_rows, widths=[1.2, 1.4, 3.4, 0.9])

    add_heading(doc, "Revisión de interfaz", 2)
    doc.add_paragraph(
        "Probé la pantalla de acceso, el panel y el formulario de productos en una vista de escritorio y una vista móvil de 390 por 844 píxeles. "
        "La auditoría de Lighthouse obtuvo 100 puntos en accesibilidad, buenas prácticas y SEO. También verifiqué que la consola del navegador no mostrara errores."
    )

    add_heading(doc, "Revisión de dependencias", 2)
    doc.add_paragraph(
        "Ejecuté la auditoría de pnpm sobre las dependencias de producción. El resultado no reportó vulnerabilidades conocidas al 19 de noviembre de 2026."
    )

    add_heading(doc, "Despliegue y elección de Vercel", 1)
    doc.add_paragraph(
        "Elegí Vercel porque puede ejecutar funciones de Node.js, sirve los archivos estáticos de la interfaz y se integra con GitHub Actions. "
        "Para esta actividad evita administrar un servidor completo y permite guardar las variables de MongoDB y JWT fuera del repositorio."
    )
    justification_rows = [
        ("Compatibilidad", "Ejecuta la API de Express mediante una función de Node.js y sirve la interfaz estática."),
        ("Integración", "Acepta despliegues desde GitHub y también desde el pipeline configurado."),
        ("Seguridad", "Administra variables de entorno cifradas por ambiente."),
        ("Operación", "Genera una URL HTTPS y conserva versiones anteriores del despliegue."),
        ("Costo inicial", "El plan de entrada es suficiente para demostrar la actividad y validar el producto."),
        ("Escalabilidad", "La función reutiliza la conexión de Mongoose y permite aumentar capacidad sin cambiar la interfaz."),
    ]
    add_table(doc, ["Criterio", "Justificación"], justification_rows, widths=[1.6, 5.2])

    add_heading(doc, "Configuración de MongoDB Atlas", 2)
    add_number(doc, "Crear un clúster y un usuario exclusivo para CajaClara.")
    add_number(doc, "Autorizar las IP necesarias. Si Vercel requiere acceso general, usar 0.0.0.0/0 con credenciales limitadas y una contraseña exclusiva.")
    add_number(doc, "Guardar la cadena privada como MONGODB_URI en Vercel y en el archivo .env local.")
    add_number(doc, "Definir JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV y CLIENT_ORIGIN en el ambiente de producción.")
    add_number(doc, "Consultar la ruta /api/health y completar un registro, un login y una operación CRUD.")

    doc.add_page_break()
    add_heading(doc, "Pipeline de CI y CD", 2)
    doc.add_paragraph(
        "El archivo .github/workflows/ci-cd.yml automatiza la validación y la publicación. En cada pull request o push a main instala las dependencias desde el archivo de bloqueo y ejecuta la cobertura de Jest. "
        "Cuando el evento es un push a main y las pruebas terminan correctamente, el segundo trabajo construye y despliega la versión de producción."
    )
    pipeline_rows = [
        ("1", "Descargar", "GitHub Actions obtiene el contenido del repositorio."),
        ("2", "Preparar", "Configura Node.js 22.13 y pnpm 11.25.0."),
        ("3", "Instalar", "Usa pnpm install con el archivo de bloqueo."),
        ("4", "Probar", "Ejecuta las 16 pruebas y genera cobertura."),
        ("5", "Construir", "Vercel prepara los artefactos de producción."),
        ("6", "Publicar", "Vercel despliega sólo si las pruebas aprobaron."),
    ]
    add_table(doc, ["Paso", "Etapa", "Acción"], pipeline_rows, widths=[0.7, 1.4, 4.7])

    add_heading(doc, "Secretos requeridos en GitHub", 2)
    add_bullet(doc, "VERCEL_TOKEN para autorizar el despliegue.")
    add_bullet(doc, "VERCEL_ORG_ID para identificar la cuenta o equipo.")
    add_bullet(doc, "VERCEL_PROJECT_ID para identificar el proyecto de CajaClara.")

    add_heading(doc, "Ejecución y entrega", 1)
    add_heading(doc, "Ejecución local", 2)
    execution_steps = [
        "Clonar el repositorio y entrar a la carpeta CajaClara.",
        "Ejecutar pnpm install.",
        "Copiar .env.example como .env y completar las variables privadas.",
        "Ejecutar pnpm start.",
        "Abrir http://localhost:3000 en el navegador.",
        "Ejecutar pnpm test:coverage para repetir la validación.",
    ]
    for step_number, step_text in enumerate(execution_steps, start=1):
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.left_indent = Inches(0.2)
        paragraph.paragraph_format.first_line_indent = Inches(-0.2)
        paragraph.paragraph_format.space_after = Pt(3)
        paragraph.add_run(f"{step_number}.  ").bold = True
        paragraph.add_run(step_text)

    add_heading(doc, "Enlaces de entrega", 2)
    repo_paragraph = doc.add_paragraph()
    repo_paragraph.add_run("Repositorio de GitHub  ").bold = True
    add_hyperlink(repo_paragraph, "Abrir repositorio CajaClara", "https://github.com/angeelpc/CajaClara")
    deploy_paragraph = doc.add_paragraph()
    deploy_paragraph.add_run("Aplicación en Vercel  ").bold = True
    add_hyperlink(deploy_paragraph, "Abrir CajaClara en Vercel", "https://caja-clara-chi.vercel.app/")

    doc.add_page_break()
    add_heading(doc, "Archivos principales", 2)
    files_rows = [
        ("README.md", "Instrucciones, endpoints, variables y pasos de despliegue."),
        ("src", "Código de servidor, modelos, rutas, validadores y middleware."),
        ("public", "Interfaz web adaptable."),
        ("tests", "Pruebas de autenticación y productos."),
        (".github/workflows/ci-cd.yml", "Pipeline de integración y despliegue."),
        ("vercel.json", "Rutas y construcción para Vercel."),
        (".env.example", "Plantilla segura de variables de entorno."),
        ("docs", "Documento Word y diagrama entidad relación."),
    ]
    add_table(doc, ["Ruta", "Contenido"], files_rows, widths=[2.4, 4.4])

    add_heading(doc, "Conclusión", 2)
    doc.add_paragraph(
        "Con CajaClara cumplí el CRUD de productos, la autenticación y autorización con JWT, la persistencia activa en MongoDB Atlas, las pruebas con Jest y la automatización de CI/CD. "
        "Además, presenté la solución como un inventario con un propósito comercial concreto y comprobé el despliegue público desde GitHub Actions hasta Vercel."
    )

    doc.save(DOCX_PATH)
    print(DOCX_PATH)


if __name__ == "__main__":
    build_er_diagram()
    build_document()
