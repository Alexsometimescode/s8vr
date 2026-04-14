import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

interface InvoiceItem {
  description: string;
  amount: number;
}

interface InvoicePdfData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  amount: number;
  issueDate: string;
  dueDate: string;
  currency?: string;
  senderName?: string;
  senderEmail?: string;
  senderLogo?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 36,
    fontFamily: 'Helvetica',
    color: '#000000',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  senderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    backgroundColor: '#000000',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  senderEmail: {
    fontSize: 9,
    color: '#71717a',
    marginTop: 1,
  },
  invoiceLabel: {
    fontSize: 8,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'right',
    marginTop: 2,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  amountLabel: {
    fontSize: 8,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  billedToSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  billedToLabel: {
    fontSize: 8,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  billedToName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  billedToEmail: {
    fontSize: 9,
    color: '#71717a',
    marginTop: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  itemDescription: {
    fontSize: 10,
    color: '#000000',
    flex: 1,
  },
  itemAmount: {
    fontSize: 10,
    color: '#71717a',
    fontFamily: 'Helvetica',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  totalAmount: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 8,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 10,
    color: '#000000',
  },
});

const formatCurrency = (amount: number, currency?: string): string => {
  const symbol = currency && currency.toUpperCase() !== 'USD' ? currency.toUpperCase() + ' ' : '$';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const InvoicePdfDocument: React.FC<{ data: InvoicePdfData }> = ({ data }) => {
  const total = data.items.length > 0
    ? data.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    : data.amount;

  const initial = (data.senderName || 'B').charAt(0).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.senderBlock}>
            {data.senderLogo ? (
              <Image src={data.senderLogo} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View>
              <Text style={styles.senderName}>{data.senderName || 'Your Business'}</Text>
              {data.senderEmail ? <Text style={styles.senderEmail}>{data.senderEmail}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>Invoice #</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Big Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Due</Text>
          <Text style={styles.amountValue}>{formatCurrency(total, data.currency)}</Text>
        </View>

        {/* Billed To */}
        <View style={styles.billedToSection}>
          <Text style={styles.billedToLabel}>Billed To</Text>
          <Text style={styles.billedToName}>{data.clientName}</Text>
          <Text style={styles.billedToEmail}>{data.clientEmail}</Text>
        </View>

        {/* Line Items */}
        <View style={styles.divider} />
        {data.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Text style={styles.itemAmount}>{formatCurrency(item.amount, data.currency)}</Text>
          </View>
        ))}

        {/* Total */}
        {data.items.length > 1 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(total, data.currency)}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Issue Date</Text>
            <Text style={styles.footerValue}>{formatDate(data.issueDate)}</Text>
          </View>
          <View>
            <Text style={styles.footerLabel}>Due Date</Text>
            <Text style={styles.footerValue}>{formatDate(data.dueDate)}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export const generateInvoicePdf = async (data: InvoicePdfData): Promise<Buffer> => {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const buffer = await renderToBuffer(<InvoicePdfDocument data={data} />);
  return buffer as Buffer;
};
