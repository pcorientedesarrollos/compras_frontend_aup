/**
 * ============================================================================
 * 📄 PDF SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para generación de PDFs profesionales
 * - Entradas de miel
 * - Salidas de miel
 * - Reportes varios
 *
 * Librerías: jsPDF + jspdf-autotable
 *
 * ============================================================================
 */

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EntradaMielDetailAPI } from '../models/index';

/**
 * Información adicional del apicultor para el PDF
 */
export interface ApicultorInfoPdf {
    codigo: string;
    curp: string;
    rfc?: string | null;
    direccion?: string | null;
    idRasmiel?: string | null;
    uppSiniiga?: string | null;
}

/**
 * Opciones adicionales para generar el PDF de entrada
 */
export interface PdfEntradaOptions {
    apicultorInfo?: ApicultorInfoPdf;
    acopiadorNombre?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    // ============================================================================
    // CONSTANTES DE DISEÑO
    // ============================================================================

    private readonly COLORS = {
        primary: [245, 158, 11] as [number, number, number],      // honey-primary #F59E0B
        dark: [146, 64, 14] as [number, number, number],          // honey-dark #92400E
        text: [31, 41, 55] as [number, number, number],           // gray-800
        lightGray: [243, 244, 246] as [number, number, number],   // gray-100
        white: [255, 255, 255] as [number, number, number],
        green: [34, 197, 94] as [number, number, number],         // green-500
        red: [239, 68, 68] as [number, number, number],           // red-500
        blue: [59, 130, 246] as [number, number, number],         // blue-500
        amber: [245, 158, 11] as [number, number, number],        // amber-500
    };

    private readonly FONT_SIZES = {
        title: 18,
        subtitle: 14,
        normal: 10,
        small: 8,
        tiny: 7
    };

    // ============================================================================
    // ENTRADA DE MIEL - PDF
    // ============================================================================

    /**
     * Genera PDF profesional de una entrada de miel
     * @param entrada Datos de la entrada de miel
     * @param options Opciones adicionales (info apicultor, nombre acopiador)
     */
    generarPdfEntrada(entrada: EntradaMielDetailAPI, options?: PdfEntradaOptions): void {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 15;

        // ========== HEADER ==========
        yPos = this.drawHeader(doc, yPos, pageWidth, options?.acopiadorNombre);

        // ========== TÍTULO DEL DOCUMENTO ==========
        yPos = this.drawDocumentTitle(doc, yPos, pageWidth, 'COMPROBANTE DE ENTRADA DE MIEL');

        // ========== INFORMACIÓN DE LA ENTRADA ==========
        yPos = this.drawEntradaInfo(doc, yPos, pageWidth, entrada);

        // ========== INFORMACIÓN DEL APICULTOR (si está disponible) ==========
        if (options?.apicultorInfo) {
            yPos = this.drawApicultorInfo(doc, yPos, pageWidth, entrada.apicultorNombre, options.apicultorInfo);
        }

        // ========== TABLA DE DETALLES ==========
        yPos = this.drawDetallesTable(doc, yPos, entrada);

        // ========== RESUMEN DE TOTALES ==========
        yPos = this.drawTotales(doc, yPos, pageWidth, entrada);

        // ========== FOOTER ==========
        this.drawFooter(doc, pageWidth, options?.acopiadorNombre);

        // ========== GUARDAR PDF ==========
        const fileName = `Entrada_${entrada.folio.replace(/\//g, '-')}_${this.formatDateForFileName(entrada.fecha)}.pdf`;
        doc.save(fileName);
    }

    // ============================================================================
    // COMPONENTES DEL PDF
    // ============================================================================

    /**
     * Dibuja el header con logo, nombre de empresa y acopiador
     */
    private drawHeader(doc: jsPDF, yPos: number, pageWidth: number, acopiadorNombre?: string): number {
        // Barra superior con color primario
        doc.setFillColor(...this.COLORS.primary);
        doc.rect(0, 0, pageWidth, 8, 'F');

        // Nombre de la empresa
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(this.FONT_SIZES.title);
        doc.setTextColor(...this.COLORS.dark);
        doc.text('OAXACA MIEL', pageWidth / 2, yPos + 8, { align: 'center' });

        // Subtítulo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(this.FONT_SIZES.small);
        doc.setTextColor(...this.COLORS.text);
        doc.text('Sistema de Trazabilidad de Miel', pageWidth / 2, yPos + 14, { align: 'center' });

        // Nombre del acopiador (si está disponible)
        if (acopiadorNombre) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(this.FONT_SIZES.small);
            doc.setTextColor(...this.COLORS.dark);
            doc.text(`Acopiador: ${acopiadorNombre}`, pageWidth / 2, yPos + 20, { align: 'center' });
        }

        // Línea separadora
        doc.setDrawColor(...this.COLORS.primary);
        doc.setLineWidth(0.5);
        const lineY = acopiadorNombre ? yPos + 26 : yPos + 20;
        doc.line(15, lineY, pageWidth - 15, lineY);

        return acopiadorNombre ? yPos + 34 : yPos + 28;
    }

    /**
     * Dibuja el título del documento
     */
    private drawDocumentTitle(doc: jsPDF, yPos: number, pageWidth: number, title: string): number {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(this.FONT_SIZES.subtitle);
        doc.setTextColor(...this.COLORS.dark);
        doc.text(title, pageWidth / 2, yPos, { align: 'center' });

        return yPos + 10;
    }

    /**
     * Dibuja la información general de la entrada
     */
    private drawEntradaInfo(doc: jsPDF, yPos: number, pageWidth: number, entrada: EntradaMielDetailAPI): number {
        const leftCol = 15;
        const rightCol = pageWidth / 2 + 10;
        const labelWidth = 35;

        // Fondo gris claro para la sección
        doc.setFillColor(...this.COLORS.lightGray);
        doc.roundedRect(10, yPos - 3, pageWidth - 20, 32, 3, 3, 'F');

        doc.setFontSize(this.FONT_SIZES.normal);

        // Columna izquierda
        this.drawLabelValue(doc, leftCol, yPos + 5, 'Folio:', entrada.folio, labelWidth);
        this.drawLabelValue(doc, leftCol, yPos + 12, 'Fecha:', this.formatDate(entrada.fecha), labelWidth);
        this.drawLabelValue(doc, leftCol, yPos + 19, 'Apicultor:', entrada.apicultorNombre, labelWidth);

        // Columna derecha
        this.drawLabelValue(doc, rightCol, yPos + 5, 'Estado:', entrada.estado, 30);
        this.drawLabelValue(doc, rightCol, yPos + 12, 'Detalles:', `${entrada.detalles.length} registros`, 30);

        // Badge de estado
        const estadoX = rightCol + 30;
        const estadoY = yPos + 2;
        if (entrada.estado === 'ACTIVO') {
            doc.setFillColor(...this.COLORS.green);
        } else {
            doc.setFillColor(...this.COLORS.red);
        }
        doc.roundedRect(estadoX, estadoY, 20, 6, 2, 2, 'F');
        doc.setFontSize(this.FONT_SIZES.tiny);
        doc.setTextColor(...this.COLORS.white);
        doc.text(entrada.estado, estadoX + 10, estadoY + 4.2, { align: 'center' });

        return yPos + 38;
    }

    /**
     * Dibuja la información de identificación del apicultor
     */
    private drawApicultorInfo(
        doc: jsPDF,
        yPos: number,
        pageWidth: number,
        apicultorNombre: string,
        info: ApicultorInfoPdf
    ): number {
        const leftCol = 15;
        const rightCol = pageWidth / 2 + 10;
        const labelWidth = 35;

        // Título de sección
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(this.FONT_SIZES.normal);
        doc.setTextColor(...this.COLORS.dark);
        doc.text('DATOS DEL APICULTOR', leftCol, yPos);
        yPos += 5;

        // Calcular altura según campos disponibles
        const hasRfc = info.rfc && info.rfc.trim() !== '';
        const hasDireccion = info.direccion && info.direccion.trim() !== '';
        const hasRasmiel = info.idRasmiel && info.idRasmiel.trim() !== '';
        const hasSiniiga = info.uppSiniiga && info.uppSiniiga.trim() !== '';

        // Altura base para nombre, código y CURP
        let boxHeight = 25;
        // Agregar espacio si hay campos adicionales
        if (hasRfc || hasDireccion) boxHeight += 7;
        if (hasRasmiel || hasSiniiga) boxHeight += 7;

        // Fondo gris claro para la sección
        doc.setFillColor(...this.COLORS.lightGray);
        doc.roundedRect(10, yPos - 3, pageWidth - 20, boxHeight, 3, 3, 'F');

        doc.setFontSize(this.FONT_SIZES.normal);

        // Fila 1: Nombre y Código
        this.drawLabelValue(doc, leftCol, yPos + 5, 'Nombre:', apicultorNombre, labelWidth);
        this.drawLabelValue(doc, rightCol, yPos + 5, 'Código:', info.codigo, 30);

        // Fila 2: CURP y RFC
        this.drawLabelValue(doc, leftCol, yPos + 12, 'CURP:', info.curp, labelWidth);
        if (hasRfc) {
            this.drawLabelValue(doc, rightCol, yPos + 12, 'RFC:', info.rfc!, 30);
        }

        let currentY = yPos + 19;

        // Fila 3: Dirección (si existe)
        if (hasDireccion) {
            this.drawLabelValue(doc, leftCol, currentY, 'Dirección:', info.direccion!, labelWidth);
            currentY += 7;
        }

        // Fila 4: Certificaciones (si existen)
        if (hasRasmiel) {
            this.drawLabelValue(doc, leftCol, currentY, 'ID-RASMIEL:', info.idRasmiel!, labelWidth);
        }
        if (hasSiniiga) {
            this.drawLabelValue(doc, rightCol, currentY, 'UPPSINIIGA:', info.uppSiniiga!, 35);
        }

        return yPos + boxHeight + 5;
    }

    /**
     * Dibuja la tabla de detalles de la entrada
     */
    private drawDetallesTable(doc: jsPDF, yPos: number, entrada: EntradaMielDetailAPI): number {
        // Título de sección
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(this.FONT_SIZES.normal);
        doc.setTextColor(...this.COLORS.dark);
        doc.text('DETALLE DE ENTRADAS', 15, yPos);
        yPos += 5;

        // Preparar datos para la tabla
        const tableData = entrada.detalles.map((detalle, index) => [
            (index + 1).toString(),
            detalle.tipoMielNombre,
            this.getClasificacionLabel(detalle.clasificacion),
            `${detalle.kilos.toFixed(2)} kg`,
            `${detalle.humedad.toFixed(1)}%`,
            this.formatCurrency(detalle.precio),
            this.formatCurrency(detalle.costoTotal),
            detalle.estadoUso === 'USADO' ? 'Usado' : detalle.estadoUso === 'CANCELADO' ? 'Cancelado' : 'Disponible'
        ]);

        // Generar tabla con autoTable
        autoTable(doc, {
            startY: yPos,
            head: [[
                '#',
                'Tipo de Miel',
                'Clasificación',
                'Kilos',
                'Humedad',
                'Precio/Kg',
                'Costo Total',
                'Estado'
            ]],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: this.COLORS.dark,
                textColor: this.COLORS.white,
                fontStyle: 'bold',
                fontSize: this.FONT_SIZES.small,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: this.FONT_SIZES.small,
                textColor: this.COLORS.text
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'left', cellWidth: 30 },
                2: { halign: 'center', cellWidth: 28 },
                3: { halign: 'right', cellWidth: 22 },
                4: { halign: 'center', cellWidth: 18 },
                5: { halign: 'right', cellWidth: 22 },
                6: { halign: 'right', cellWidth: 25 },
                7: { halign: 'center', cellWidth: 22 }
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251] // gray-50
            },
            margin: { left: 15, right: 15 },
            didParseCell: (data) => {
                // Colorear la columna de estado
                if (data.section === 'body' && data.column.index === 7) {
                    const cellText = data.cell.text[0];
                    if (cellText === 'Usado') {
                        data.cell.styles.textColor = [107, 114, 128]; // gray-500
                    } else {
                        data.cell.styles.textColor = [34, 197, 94]; // green-500
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
                // Colorear clasificación
                if (data.section === 'body' && data.column.index === 2) {
                    const cellText = data.cell.text[0];
                    if (cellText.includes('EXPORTACIÓN 1')) {
                        data.cell.styles.textColor = [22, 163, 74]; // green-600
                    } else if (cellText.includes('EXPORTACIÓN 2')) {
                        data.cell.styles.textColor = [37, 99, 235]; // blue-600
                    } else if (cellText === 'NACIONAL') {
                        data.cell.styles.textColor = [217, 119, 6]; // amber-600
                    } else if (cellText === 'INDUSTRIA') {
                        data.cell.styles.textColor = [220, 38, 38]; // red-600
                    }
                }
            }
        });

        // Obtener la posición Y después de la tabla
        return (doc as any).lastAutoTable.finalY + 10;
    }

    /**
     * Dibuja el resumen de totales
     */
    private drawTotales(doc: jsPDF, yPos: number, pageWidth: number, entrada: EntradaMielDetailAPI): number {
        const totalKilos = entrada.detalles.reduce((sum, d) => sum + d.kilos, 0);
        const totalCosto = entrada.detalles.reduce((sum, d) => sum + d.costoTotal, 0);
        const detallesDisponibles = entrada.detalles.filter(d => d.estadoUso === 'DISPONIBLE').length;
        const detallesUsados = entrada.detalles.filter(d => d.estadoUso === 'USADO').length;

        // Caja de totales
        const boxWidth = 85;
        const boxX = pageWidth - boxWidth - 15;

        doc.setFillColor(...this.COLORS.lightGray);
        doc.roundedRect(boxX, yPos, boxWidth, 35, 3, 3, 'F');

        // Borde superior con color primario
        doc.setFillColor(...this.COLORS.primary);
        doc.roundedRect(boxX, yPos, boxWidth, 6, 3, 3, 'F');
        doc.rect(boxX, yPos + 3, boxWidth, 3, 'F');

        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(this.FONT_SIZES.small);
        doc.setTextColor(...this.COLORS.white);
        doc.text('RESUMEN', boxX + boxWidth / 2, yPos + 4.5, { align: 'center' });

        // Valores
        doc.setTextColor(...this.COLORS.text);
        doc.setFontSize(this.FONT_SIZES.small);

        const labelX = boxX + 5;
        const valueX = boxX + boxWidth - 5;

        doc.setFont('helvetica', 'normal');
        doc.text('Total Kilos:', labelX, yPos + 14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalKilos.toFixed(2)} kg`, valueX, yPos + 14, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.text('Total Costo:', labelX, yPos + 21);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.COLORS.dark);
        doc.text(this.formatCurrency(totalCosto), valueX, yPos + 21, { align: 'right' });

        doc.setTextColor(...this.COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.text('Disponibles/Usados:', labelX, yPos + 28);
        doc.setFont('helvetica', 'bold');
        doc.text(`${detallesDisponibles} / ${detallesUsados}`, valueX, yPos + 28, { align: 'right' });

        return yPos + 45;
    }

    /**
     * Dibuja el footer del documento
     */
    private drawFooter(doc: jsPDF, pageWidth: number, acopiadorNombre?: string): void {
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerY = pageHeight - 15;

        // Línea separadora
        doc.setDrawColor(...this.COLORS.primary);
        doc.setLineWidth(0.3);
        doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

        // Fecha de generación
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(this.FONT_SIZES.tiny);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(`Generado el: ${this.formatDateTime(new Date())}`, 15, footerY);

        // Nombre del sistema o acopiador
        const centerText = acopiadorNombre
            ? `Generado por: ${acopiadorNombre}`
            : 'Sistema Oaxaca Miel - Trazabilidad';
        doc.text(centerText, pageWidth / 2, footerY, { align: 'center' });

        // Página
        doc.text('Página 1 de 1', pageWidth - 15, footerY, { align: 'right' });
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * Dibuja un par label-value
     */
    private drawLabelValue(doc: jsPDF, x: number, y: number, label: string, value: string, labelWidth: number): void {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.COLORS.text);
        doc.text(label, x, y);

        doc.setFont('helvetica', 'normal');
        doc.text(value, x + labelWidth, y);
    }

    /**
     * Obtener etiqueta de clasificación
     */
    private getClasificacionLabel(clasificacion: string): string {
        switch (clasificacion) {
            case 'EXPORTACION_1': return 'EXPORTACIÓN 1';
            case 'EXPORTACION_2': return 'EXPORTACIÓN 2';
            case 'NACIONAL': return 'NACIONAL';
            case 'INDUSTRIA': return 'INDUSTRIA';
            default: return clasificacion;
        }
    }

    /**
     * Formatear fecha para display
     */
    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
    }

    /**
     * Formatear fecha y hora
     */
    private formatDateTime(date: Date): string {
        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formatear fecha para nombre de archivo
     */
    private formatDateForFileName(dateString: string): string {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    /**
     * Formatear moneda
     */
    private formatCurrency(value: number): string {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
