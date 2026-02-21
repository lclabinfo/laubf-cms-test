# 10. Online Giving & Donations System

> **Document Version**: 3.0 Enterprise Edition
> **Last Updated**: December 2024
> **Compliance**: PCI DSS Level 1, SOC 2 Type II Ready

---

## Overview

The Online Giving System provides churches with a comprehensive, secure, and user-friendly platform for accepting donations. Designed to compete with and exceed leading church giving platforms like Tithely, Pushpay, and Subsplash, our solution offers multiple giving methods, competitive processing fees, and powerful administrative tools.

### Competitive Analysis

| Feature | Tithely | Pushpay | Subsplash | **Digital Church** |
|---------|---------|---------|-----------|-------------------|
| Processing Fee | 3.5% + $0.30 | 2.9% + $0.30 | 2.3% + $0.30 | **2.0% + $0.25** |
| ACH Fee | 1.0% + $0.30 | 1.0% | 0.8% | **0.5%** |
| Recurring Giving | Yes | Yes | Yes | **Yes + Smart** |
| Text-to-Give | Yes | Yes | Yes | **Yes** |
| Kiosk Mode | Basic | Premium | Yes | **Included** |
| Stock/Crypto | Limited | No | No | **Yes** |
| Multi-Currency | Yes | Limited | Limited | **Full** |
| Batch Import | Yes | Yes | Yes | **Enhanced** |
| Custom Receipts | Basic | Yes | Yes | **Advanced** |
| Fund Management | Yes | Yes | Yes | **Unlimited** |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Giving System Architecture                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │                        Giving Channels                                  │    │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│   │   │  Website │ │  Mobile  │ │  Text    │ │  Kiosk   │ │  Widget  │   │    │
│   │   │   Form   │ │   App    │ │  2Give   │ │   Mode   │ │  Embed   │   │    │
│   │   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │    │
│   └────────┼────────────┼────────────┼────────────┼────────────┼─────────┘    │
│            │            │            │            │            │              │
│            └────────────┴────────────┼────────────┴────────────┘              │
│                                      ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                    Payment Processing Layer                          │      │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│   │   │   Stripe    │ │   PayPal    │ │    ACH      │ │  Apple/     │  │      │
│   │   │  (Primary)  │ │  (Alt)      │ │  (Direct)   │  │  Google Pay │  │      │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│   └───────────────────────────────────┬─────────────────────────────────┘      │
│                                       ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                      Transaction Manager                             │      │
│   │   • Donation Processing      • Refund Handling                       │      │
│   │   • Recurring Management     • Batch Processing                      │      │
│   │   • Fee Calculation          • Currency Conversion                   │      │
│   └───────────────────────────────────┬─────────────────────────────────┘      │
│                                       ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                      Post-Transaction Services                       │      │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │      │
│   │   │   Receipt   │ │   Donor     │ │    Fund     │ │  Analytics  │  │      │
│   │   │  Generator  │ │   Update    │ │  Allocation │ │   Tracker   │  │      │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Giving Models

```prisma
// prisma/schema.prisma

model Donation {
  id                String            @id @default(uuid())
  tenantId          String            @map("tenant_id")
  donorId           String?           @map("donor_id")

  // Amount Details
  amount            Decimal           @db.Decimal(12, 2)
  currency          String            @default("USD")
  amountInCents     Int               @map("amount_in_cents")
  netAmount         Decimal?          @map("net_amount") @db.Decimal(12, 2)
  processingFee     Decimal?          @map("processing_fee") @db.Decimal(8, 2)
  platformFee       Decimal?          @map("platform_fee") @db.Decimal(8, 2)

  // Fund Allocation
  fundId            String?           @map("fund_id")
  campaignId        String?           @map("campaign_id")

  // Payment Info
  paymentMethod     PaymentMethod
  paymentProcessor  PaymentProcessor  @default(STRIPE)
  processorTxId     String?           @map("processor_tx_id")
  processorFee      Decimal?          @map("processor_fee") @db.Decimal(8, 2)
  last4             String?                               // Last 4 of card/account
  cardBrand         String?           @map("card_brand")  // visa, mastercard, etc.

  // Status
  status            DonationStatus    @default(PENDING)
  failureReason     String?           @map("failure_reason")
  refundedAt        DateTime?         @map("refunded_at")
  refundAmount      Decimal?          @map("refund_amount") @db.Decimal(12, 2)

  // Recurring
  isRecurring       Boolean           @default(false) @map("is_recurring")
  recurringId       String?           @map("recurring_id")

  // Source
  source            DonationSource    @default(WEBSITE)
  ipAddress         String?           @map("ip_address")
  userAgent         String?           @map("user_agent")

  // Donor Info (for guest donations)
  guestEmail        String?           @map("guest_email")
  guestName         String?           @map("guest_name")
  guestPhone        String?           @map("guest_phone")

  // Cover Fees
  coversFees        Boolean           @default(false) @map("covers_fees")
  feesCoveredAmount Decimal?          @map("fees_covered_amount") @db.Decimal(8, 2)

  // Notes
  memo              String?           @db.Text
  internalNote      String?           @map("internal_note") @db.Text
  isAnonymous       Boolean           @default(false) @map("is_anonymous")

  // Tax Receipt
  receiptSent       Boolean           @default(false) @map("receipt_sent")
  receiptSentAt     DateTime?         @map("receipt_sent_at")
  receiptNumber     String?           @map("receipt_number")

  // Timestamps
  createdAt         DateTime          @default(now()) @map("created_at")
  processedAt       DateTime?         @map("processed_at")

  // Relations
  tenant            Tenant            @relation(fields: [tenantId], references: [id])
  donor             Donor?            @relation(fields: [donorId], references: [id])
  fund              GivingFund?       @relation(fields: [fundId], references: [id])
  campaign          GivingCampaign?   @relation(fields: [campaignId], references: [id])
  recurring         RecurringDonation? @relation(fields: [recurringId], references: [id])
  allocations       DonationAllocation[]

  @@index([tenantId, status])
  @@index([tenantId, donorId])
  @@index([tenantId, createdAt])
  @@index([tenantId, fundId])
  @@index([tenantId, campaignId])
  @@index([processorTxId])
  @@map("donations")
}

model Donor {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  memberId        String?   @map("member_id")  // Link to church member

  // Contact Info
  email           String
  firstName       String    @map("first_name")
  lastName        String    @map("last_name")
  phone           String?
  address         Json?     // { street, city, state, zip, country }

  // Giving Profile
  lifetimeGiving  Decimal   @default(0) @map("lifetime_giving") @db.Decimal(14, 2)
  yearToDateGiving Decimal  @default(0) @map("ytd_giving") @db.Decimal(12, 2)
  lastDonationAt  DateTime? @map("last_donation_at")
  donationCount   Int       @default(0) @map("donation_count")

  // Saved Payment Methods
  stripeCustomerId String?  @map("stripe_customer_id")
  defaultPaymentId String?  @map("default_payment_id")

  // Preferences
  receiptPreference String  @default("EMAIL") @map("receipt_preference") // EMAIL, MAIL, BOTH
  communicationOptIn Boolean @default(true) @map("communication_opt_in")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  member          Member?   @relation(fields: [memberId], references: [id])
  donations       Donation[]
  recurringDonations RecurringDonation[]
  paymentMethods  PaymentMethod[]
  pledges         Pledge[]

  @@unique([tenantId, email])
  @@index([tenantId, lastName])
  @@map("donors")
}

model GivingFund {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  name            String
  description     String?   @db.Text
  code            String?                   // Fund code for accounting
  glAccountCode   String?   @map("gl_account_code")

  // Display
  isActive        Boolean   @default(true) @map("is_active")
  isDefault       Boolean   @default(false) @map("is_default")
  showOnWebsite   Boolean   @default(true) @map("show_on_website")
  sortOrder       Int       @default(0) @map("sort_order")

  // Tax
  isTaxDeductible Boolean   @default(true) @map("is_tax_deductible")

  // Goals
  goalAmount      Decimal?  @map("goal_amount") @db.Decimal(12, 2)
  goalDeadline    DateTime? @map("goal_deadline")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  donations       Donation[]
  allocations     DonationAllocation[]

  @@unique([tenantId, name])
  @@index([tenantId, isActive])
  @@map("giving_funds")
}

model GivingCampaign {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  name            String
  slug            String
  description     String?   @db.Text
  shortDesc       String?   @map("short_desc")
  featuredImage   String?   @map("featured_image")

  // Goals
  goalAmount      Decimal   @map("goal_amount") @db.Decimal(14, 2)
  raisedAmount    Decimal   @default(0) @map("raised_amount") @db.Decimal(14, 2)
  donorCount      Int       @default(0) @map("donor_count")

  // Timeline
  startDate       DateTime  @map("start_date")
  endDate         DateTime? @map("end_date")
  status          CampaignStatus @default(DRAFT)

  // Display
  showProgress    Boolean   @default(true) @map("show_progress")
  showDonorNames  Boolean   @default(false) @map("show_donor_names")
  showRecentDonations Boolean @default(false) @map("show_recent_donations")

  // Options
  allowRecurring  Boolean   @default(true) @map("allow_recurring")
  suggestedAmounts Int[]    @default([]) @map("suggested_amounts")
  fundId          String?   @map("fund_id")  // Default fund for campaign

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  fund            GivingFund? @relation(fields: [fundId], references: [id])
  donations       Donation[]

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@map("giving_campaigns")
}

model RecurringDonation {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  donorId         String    @map("donor_id")
  fundId          String?   @map("fund_id")

  // Amount
  amount          Decimal   @db.Decimal(12, 2)
  currency        String    @default("USD")
  coversFees      Boolean   @default(false) @map("covers_fees")

  // Schedule
  frequency       RecurringFrequency
  nextDate        DateTime  @map("next_date")
  startDate       DateTime  @map("start_date")
  endDate         DateTime? @map("end_date")
  dayOfMonth      Int?      @map("day_of_month")
  dayOfWeek       Int?      @map("day_of_week")

  // Payment
  paymentMethodId String    @map("payment_method_id")
  stripeSubId     String?   @map("stripe_subscription_id")

  // Status
  status          RecurringStatus @default(ACTIVE)
  failureCount    Int       @default(0) @map("failure_count")
  lastFailure     String?   @map("last_failure")
  pausedAt        DateTime? @map("paused_at")
  cancelledAt     DateTime? @map("cancelled_at")
  cancelReason    String?   @map("cancel_reason")

  // Stats
  totalDonated    Decimal   @default(0) @map("total_donated") @db.Decimal(14, 2)
  donationCount   Int       @default(0) @map("donation_count")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  donor           Donor     @relation(fields: [donorId], references: [id])
  fund            GivingFund? @relation(fields: [fundId], references: [id])
  paymentMethod   PaymentMethod @relation(fields: [paymentMethodId], references: [id])
  donations       Donation[]

  @@index([tenantId, status])
  @@index([tenantId, nextDate])
  @@map("recurring_donations")
}

model DonationAllocation {
  id          String      @id @default(uuid())
  donationId  String      @map("donation_id")
  fundId      String      @map("fund_id")
  amount      Decimal     @db.Decimal(12, 2)
  percentage  Decimal?    @db.Decimal(5, 2)

  donation    Donation    @relation(fields: [donationId], references: [id], onDelete: Cascade)
  fund        GivingFund  @relation(fields: [fundId], references: [id])

  @@map("donation_allocations")
}

model Pledge {
  id          String      @id @default(uuid())
  tenantId    String      @map("tenant_id")
  donorId     String      @map("donor_id")
  campaignId  String?     @map("campaign_id")
  fundId      String?     @map("fund_id")

  // Amount
  totalAmount Decimal     @map("total_amount") @db.Decimal(14, 2)
  paidAmount  Decimal     @default(0) @map("paid_amount") @db.Decimal(14, 2)
  currency    String      @default("USD")

  // Schedule
  startDate   DateTime    @map("start_date")
  endDate     DateTime?   @map("end_date")
  frequency   RecurringFrequency?

  // Status
  status      PledgeStatus @default(ACTIVE)
  notes       String?     @db.Text

  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  donor       Donor       @relation(fields: [donorId], references: [id])
  campaign    GivingCampaign? @relation(fields: [campaignId], references: [id])
  fund        GivingFund? @relation(fields: [fundId], references: [id])

  @@index([tenantId, donorId])
  @@index([tenantId, status])
  @@map("pledges")
}

model SavedPaymentMethod {
  id              String    @id @default(uuid())
  donorId         String    @map("donor_id")
  type            PaymentMethodType
  processorId     String    @map("processor_id")  // Stripe payment method ID

  // Card Details (for display)
  last4           String
  brand           String?
  expMonth        Int?      @map("exp_month")
  expYear         Int?      @map("exp_year")

  // Bank Account Details
  bankName        String?   @map("bank_name")
  accountType     String?   @map("account_type")  // checking, savings

  // Meta
  nickname        String?
  isDefault       Boolean   @default(false) @map("is_default")
  createdAt       DateTime  @default(now()) @map("created_at")

  // Relations
  donor           Donor     @relation(fields: [donorId], references: [id], onDelete: Cascade)
  recurringDonations RecurringDonation[]

  @@index([donorId])
  @@map("saved_payment_methods")
}

// Enums
enum PaymentMethod {
  CARD
  ACH
  APPLE_PAY
  GOOGLE_PAY
  PAYPAL
  CHECK
  CASH
  STOCK
  CRYPTO
  OTHER
}

enum PaymentProcessor {
  STRIPE
  PAYPAL
  PLAID
  MANUAL
}

enum DonationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
  DISPUTED
  CANCELLED
}

enum DonationSource {
  WEBSITE
  MOBILE_APP
  TEXT
  KIOSK
  MANUAL
  IMPORT
  API
}

enum RecurringFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  ANNUALLY
}

enum RecurringStatus {
  ACTIVE
  PAUSED
  CANCELLED
  FAILED
  COMPLETED
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum PledgeStatus {
  ACTIVE
  FULFILLED
  CANCELLED
  OVERDUE
}

enum PaymentMethodType {
  CARD
  BANK_ACCOUNT
}
```

---

## Payment Processing Service

### Stripe Integration

```typescript
// services/giving/stripe.service.ts

import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { DonationStatus, PaymentMethod, PaymentProcessor } from '@prisma/client'

export class StripeGivingService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })
  }

  /**
   * Process a one-time donation
   */
  async processOneTimeDonation(params: {
    tenantId: string
    amount: number
    currency: string
    fundId?: string
    campaignId?: string
    donorId?: string
    paymentMethodId: string
    email: string
    name?: string
    coversFees?: boolean
    memo?: string
    metadata?: Record<string, string>
  }) {
    const {
      tenantId,
      amount,
      currency,
      fundId,
      campaignId,
      donorId,
      paymentMethodId,
      email,
      name,
      coversFees = false,
      memo,
      metadata = {},
    } = params

    // Get tenant's Stripe account
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeAccountId: true, givingSettings: true },
    })

    if (!tenant?.stripeAccountId) {
      throw new Error('Church has not connected their Stripe account')
    }

    const givingSettings = tenant.givingSettings as any || {}

    // Calculate fees
    const processingFee = this.calculateProcessingFee(amount, 'card')
    const platformFee = this.calculatePlatformFee(amount, givingSettings.planType)
    const totalFees = processingFee + platformFee
    const feesCoveredAmount = coversFees ? totalFees : 0
    const chargeAmount = amount + feesCoveredAmount

    // Get or create Stripe customer
    let stripeCustomerId: string
    if (donorId) {
      const donor = await prisma.donor.findUnique({
        where: { id: donorId },
        select: { stripeCustomerId: true },
      })
      stripeCustomerId = donor?.stripeCustomerId || await this.createStripeCustomer(email, name)
    } else {
      stripeCustomerId = await this.createStripeCustomer(email, name)
    }

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: Math.round(chargeAmount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: {
          destination: tenant.stripeAccountId,
        },
        metadata: {
          tenantId,
          donorId: donorId || '',
          fundId: fundId || '',
          campaignId: campaignId || '',
          coversFees: coversFees.toString(),
          ...metadata,
        },
        receipt_email: email,
        statement_descriptor_suffix: 'Church Donation',
      },
      {
        idempotencyKey: `donation_${tenantId}_${Date.now()}`,
      }
    )

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        tenantId,
        donorId,
        amount,
        currency,
        amountInCents: Math.round(amount * 100),
        netAmount: amount - totalFees + feesCoveredAmount,
        processingFee,
        platformFee,
        fundId,
        campaignId,
        paymentMethod: PaymentMethod.CARD,
        paymentProcessor: PaymentProcessor.STRIPE,
        processorTxId: paymentIntent.id,
        processorFee: processingFee,
        last4: paymentIntent.payment_method_details?.card?.last4,
        cardBrand: paymentIntent.payment_method_details?.card?.brand,
        status: this.mapStripeStatus(paymentIntent.status),
        source: 'WEBSITE',
        guestEmail: donorId ? null : email,
        guestName: donorId ? null : name,
        coversFees,
        feesCoveredAmount,
        memo,
        processedAt: new Date(),
      },
    })

    // Update donor stats
    if (donorId) {
      await this.updateDonorStats(donorId, amount)
    }

    // Update campaign stats if applicable
    if (campaignId) {
      await this.updateCampaignStats(campaignId, amount)
    }

    return {
      donation,
      paymentIntent,
    }
  }

  /**
   * Create a recurring donation
   */
  async createRecurringDonation(params: {
    tenantId: string
    donorId: string
    amount: number
    currency: string
    fundId?: string
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
    paymentMethodId: string
    startDate?: Date
    coversFees?: boolean
  }) {
    const {
      tenantId,
      donorId,
      amount,
      currency,
      fundId,
      frequency,
      paymentMethodId,
      startDate = new Date(),
      coversFees = false,
    } = params

    // Get tenant and donor
    const [tenant, donor] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { stripeAccountId: true },
      }),
      prisma.donor.findUnique({
        where: { id: donorId },
        select: { stripeCustomerId: true, email: true },
      }),
    ])

    if (!tenant?.stripeAccountId || !donor?.stripeCustomerId) {
      throw new Error('Invalid tenant or donor configuration')
    }

    // Create Stripe subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: donor.stripeCustomerId,
      items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Recurring Donation - ${frequency}`,
          },
          unit_amount: Math.round(amount * 100),
          recurring: {
            interval: this.frequencyToStripeInterval(frequency),
            interval_count: this.getIntervalCount(frequency),
          },
        },
      }],
      default_payment_method: paymentMethodId,
      application_fee_percent: 2.0, // Platform fee
      transfer_data: {
        destination: tenant.stripeAccountId,
      },
      metadata: {
        tenantId,
        donorId,
        fundId: fundId || '',
      },
    })

    // Create recurring donation record
    const recurringDonation = await prisma.recurringDonation.create({
      data: {
        tenantId,
        donorId,
        fundId,
        amount,
        currency,
        coversFees,
        frequency,
        nextDate: this.calculateNextDate(frequency, startDate),
        startDate,
        paymentMethodId,
        stripeSubId: subscription.id,
        status: 'ACTIVE',
      },
    })

    return recurringDonation
  }

  /**
   * Process ACH bank transfer
   */
  async processACHDonation(params: {
    tenantId: string
    amount: number
    donorId?: string
    fundId?: string
    bankAccountId: string // Plaid account ID or Stripe bank account
    email: string
    name?: string
  }) {
    const { tenantId, amount, donorId, fundId, bankAccountId, email, name } = params

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeAccountId: true },
    })

    if (!tenant?.stripeAccountId) {
      throw new Error('Church has not connected their Stripe account')
    }

    // Calculate ACH fees (lower than card)
    const processingFee = amount * 0.008 // 0.8%
    const platformFee = amount * 0.005  // 0.5%

    // Create ACH payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method: bankAccountId,
      payment_method_types: ['us_bank_account'],
      confirm: true,
      mandate_data: {
        customer_acceptance: {
          type: 'online',
          online: {
            ip_address: '0.0.0.0', // Should be actual IP
            user_agent: 'Mozilla/5.0',
          },
        },
      },
      application_fee_amount: Math.round(platformFee * 100),
      transfer_data: {
        destination: tenant.stripeAccountId,
      },
      metadata: {
        tenantId,
        donorId: donorId || '',
        fundId: fundId || '',
        type: 'ACH',
      },
    })

    // Create donation record (pending until ACH clears)
    const donation = await prisma.donation.create({
      data: {
        tenantId,
        donorId,
        amount,
        currency: 'USD',
        amountInCents: Math.round(amount * 100),
        netAmount: amount - processingFee - platformFee,
        processingFee,
        platformFee,
        fundId,
        paymentMethod: PaymentMethod.ACH,
        paymentProcessor: PaymentProcessor.STRIPE,
        processorTxId: paymentIntent.id,
        status: DonationStatus.PROCESSING, // ACH takes time
        source: 'WEBSITE',
        guestEmail: donorId ? null : email,
        guestName: donorId ? null : name,
      },
    })

    return { donation, paymentIntent }
  }

  /**
   * Process refund
   */
  async processRefund(donationId: string, amount?: number, reason?: string) {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    })

    if (!donation || !donation.processorTxId) {
      throw new Error('Donation not found or not refundable')
    }

    if (donation.status === DonationStatus.REFUNDED) {
      throw new Error('Donation has already been refunded')
    }

    const refundAmount = amount || Number(donation.amount)

    // Create Stripe refund
    const refund = await this.stripe.refunds.create({
      payment_intent: donation.processorTxId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      reverse_transfer: true,
      refund_application_fee: true,
    })

    // Update donation record
    const isFullRefund = refundAmount >= Number(donation.amount)

    await prisma.donation.update({
      where: { id: donationId },
      data: {
        status: isFullRefund ? DonationStatus.REFUNDED : DonationStatus.PARTIALLY_REFUNDED,
        refundedAt: new Date(),
        refundAmount: { increment: refundAmount },
        internalNote: reason ? `Refund reason: ${reason}` : undefined,
      },
    })

    // Reverse donor stats
    if (donation.donorId) {
      await prisma.donor.update({
        where: { id: donation.donorId },
        data: {
          lifetimeGiving: { decrement: refundAmount },
          yearToDateGiving: { decrement: refundAmount },
        },
      })
    }

    return refund
  }

  // Helper methods
  private calculateProcessingFee(amount: number, method: string): number {
    if (method === 'ach') {
      return Math.min(amount * 0.008, 5.00) // 0.8% capped at $5
    }
    return amount * 0.029 + 0.30 // 2.9% + $0.30 for card
  }

  private calculatePlatformFee(amount: number, planType?: string): number {
    // Platform fee based on church's plan
    const rates: Record<string, number> = {
      starter: 0.025,   // 2.5%
      growth: 0.020,    // 2.0%
      professional: 0.015, // 1.5%
      enterprise: 0.010,   // 1.0%
    }
    return amount * (rates[planType || 'starter'] || 0.020)
  }

  private mapStripeStatus(status: Stripe.PaymentIntent.Status): DonationStatus {
    const mapping: Record<string, DonationStatus> = {
      succeeded: DonationStatus.COMPLETED,
      processing: DonationStatus.PROCESSING,
      requires_payment_method: DonationStatus.FAILED,
      requires_confirmation: DonationStatus.PENDING,
      requires_action: DonationStatus.PENDING,
      canceled: DonationStatus.CANCELLED,
    }
    return mapping[status] || DonationStatus.PENDING
  }

  private frequencyToStripeInterval(frequency: string): 'day' | 'week' | 'month' | 'year' {
    const mapping: Record<string, 'day' | 'week' | 'month' | 'year'> = {
      WEEKLY: 'week',
      BIWEEKLY: 'week',
      MONTHLY: 'month',
      QUARTERLY: 'month',
      ANNUALLY: 'year',
    }
    return mapping[frequency] || 'month'
  }

  private getIntervalCount(frequency: string): number {
    const mapping: Record<string, number> = {
      WEEKLY: 1,
      BIWEEKLY: 2,
      MONTHLY: 1,
      QUARTERLY: 3,
      ANNUALLY: 1,
    }
    return mapping[frequency] || 1
  }

  private calculateNextDate(frequency: string, startDate: Date): Date {
    const date = new Date(startDate)
    switch (frequency) {
      case 'WEEKLY':
        date.setDate(date.getDate() + 7)
        break
      case 'BIWEEKLY':
        date.setDate(date.getDate() + 14)
        break
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1)
        break
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3)
        break
      case 'ANNUALLY':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date
  }

  private async createStripeCustomer(email: string, name?: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      name,
    })
    return customer.id
  }

  private async updateDonorStats(donorId: string, amount: number) {
    await prisma.donor.update({
      where: { id: donorId },
      data: {
        lifetimeGiving: { increment: amount },
        yearToDateGiving: { increment: amount },
        lastDonationAt: new Date(),
        donationCount: { increment: 1 },
      },
    })
  }

  private async updateCampaignStats(campaignId: string, amount: number) {
    await prisma.givingCampaign.update({
      where: { id: campaignId },
      data: {
        raisedAmount: { increment: amount },
        donorCount: { increment: 1 },
      },
    })
  }
}

export const stripeGivingService = new StripeGivingService()
```

---

## Giving Form Component

```typescript
// components/giving/GivingForm.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { CreditCard, Building2, Lock, Heart, Calendar } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const givingSchema = z.object({
  amount: z.number().min(1, 'Please enter an amount'),
  fundId: z.string().optional(),
  campaignId: z.string().optional(),
  frequency: z.enum(['one-time', 'weekly', 'monthly', 'quarterly', 'annually']),
  coversFees: z.boolean(),
  email: z.string().email('Please enter a valid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  memo: z.string().optional(),
  isAnonymous: z.boolean(),
})

type GivingFormData = z.infer<typeof givingSchema>

interface GivingFormProps {
  tenantId: string
  funds: { id: string; name: string }[]
  campaign?: {
    id: string
    name: string
    goalAmount: number
    raisedAmount: number
  }
  presetAmounts?: number[]
  defaultFundId?: string
  showRecurring?: boolean
  templateConfig?: any
}

export function GivingForm({
  tenantId,
  funds,
  campaign,
  presetAmounts = [25, 50, 100, 250, 500],
  defaultFundId,
  showRecurring = true,
  templateConfig,
}: GivingFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <GivingFormContent
        tenantId={tenantId}
        funds={funds}
        campaign={campaign}
        presetAmounts={presetAmounts}
        defaultFundId={defaultFundId}
        showRecurring={showRecurring}
        templateConfig={templateConfig}
      />
    </Elements>
  )
}

function GivingFormContent({
  tenantId,
  funds,
  campaign,
  presetAmounts,
  defaultFundId,
  showRecurring,
  templateConfig,
}: GivingFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()

  const [step, setStep] = useState<'amount' | 'details' | 'payment'>('amount')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GivingFormData>({
    resolver: zodResolver(givingSchema),
    defaultValues: {
      amount: 0,
      fundId: defaultFundId || campaign?.id,
      campaignId: campaign?.id,
      frequency: 'one-time',
      coversFees: false,
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      memo: '',
      isAnonymous: false,
    },
  })

  const watchFrequency = form.watch('frequency')
  const watchCoversFees = form.watch('coversFees')
  const currentAmount = selectedAmount || parseFloat(customAmount) || 0

  // Calculate fees
  const processingFee = currentAmount * 0.029 + 0.30
  const totalAmount = watchCoversFees ? currentAmount + processingFee : currentAmount

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
    form.setValue('amount', amount)
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
    form.setValue('amount', parseFloat(value) || 0)
  }

  const handleSubmit = async (data: GivingFormData) => {
    if (!stripe || !elements) return

    setIsSubmitting(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
        },
      })

      if (error) throw new Error(error.message)

      // Process donation
      const response = await fetch('/api/giving/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          amount: totalAmount,
          paymentMethodId: paymentMethod.id,
          fundId: data.fundId,
          campaignId: data.campaignId,
          frequency: data.frequency,
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          coversFees: data.coversFees,
          memo: data.memo,
          isAnonymous: data.isAnonymous,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Payment failed')
      }

      const result = await response.json()

      // Handle payment confirmation if needed
      if (result.requiresAction) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.clientSecret
        )
        if (confirmError) throw new Error(confirmError.message)
      }

      // Success!
      toast({
        title: 'Thank you for your gift!',
        description: `Your donation of $${totalAmount.toFixed(2)} has been processed.`,
      })

      // Redirect to thank you page
      window.location.href = `/giving/thank-you?amount=${totalAmount}&fund=${data.fundId}`

    } catch (error) {
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Payment failed',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Campaign Progress */}
        {campaign && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">{campaign.name}</h3>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span>${campaign.raisedAmount.toLocaleString()} raised</span>
              <span>Goal: ${campaign.goalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Step 1: Amount */}
        {step === 'amount' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Select Gift Amount
            </h2>

            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-3">
              {presetAmounts?.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={cn(
                    'py-4 text-lg font-semibold rounded-lg border-2 transition-colors',
                    selectedAmount === amount
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-primary/50'
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label>Custom Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className={cn(
                    'pl-8 text-lg h-12',
                    customAmount && 'border-primary'
                  )}
                />
              </div>
            </div>

            {/* Fund Selection */}
            {funds.length > 1 && !campaign && (
              <div className="space-y-2">
                <Label>Designate to Fund</Label>
                <Select
                  value={form.watch('fundId')}
                  onValueChange={(value) => form.setValue('fundId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {funds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Frequency */}
            {showRecurring && (
              <div className="space-y-2">
                <Label>Giving Frequency</Label>
                <Select
                  value={watchFrequency}
                  onValueChange={(value: any) => form.setValue('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time Gift</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cover Fees */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Switch
                checked={watchCoversFees}
                onCheckedChange={(checked) => form.setValue('coversFees', checked)}
              />
              <div>
                <p className="font-medium">Cover processing fees</p>
                <p className="text-sm text-gray-500">
                  Add ${processingFee.toFixed(2)} to help cover transaction costs
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Gift</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              {watchFrequency !== 'one-time' && (
                <p className="text-sm text-gray-500 mt-1">
                  Billed {watchFrequency}
                </p>
              )}
            </div>

            <Button
              type="button"
              className="w-full h-12 text-lg"
              disabled={currentAmount < 1}
              onClick={() => setStep('details')}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Donor Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Your Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  {...form.register('firstName')}
                  placeholder="John"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  {...form.register('lastName')}
                  placeholder="Doe"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                {...form.register('email')}
                placeholder="john@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                {...form.register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Memo (optional)</Label>
              <Input
                {...form.register('memo')}
                placeholder="In memory of..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.watch('isAnonymous')}
                onCheckedChange={(checked) => form.setValue('isAnonymous', checked)}
              />
              <Label>Make my gift anonymous</Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setStep('amount')}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 h-12"
                onClick={() => setStep('payment')}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Payment Method
            </h2>

            {/* Payment Method Tabs */}
            <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="card">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="ach">
                  <Building2 className="w-4 h-4 mr-2" />
                  Bank
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#1a1a1a',
                          '::placeholder': { color: '#9ca3af' },
                        },
                      },
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ach" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium">Connect Bank Account</p>
                  <p className="text-sm text-gray-500">
                    Lower fees for bank transfers (0.5% vs 2.9%)
                  </p>
                  <Button type="button" variant="outline" className="mt-4">
                    Connect with Plaid
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Order Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Gift Amount</span>
                <span>${currentAmount.toFixed(2)}</span>
              </div>
              {watchCoversFees && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Processing fees covered</span>
                  <span>+${processingFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              {watchFrequency !== 'one-time' && (
                <p className="text-sm text-gray-500 text-center">
                  Recurring {watchFrequency} starting today
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL Encrypted • PCI Compliant</span>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setStep('details')}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12"
                disabled={isSubmitting || !stripe}
              >
                {isSubmitting ? (
                  'Processing...'
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Give ${totalAmount.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
```

---

## Giving API Endpoints

### Donation Processing

```typescript
// app/api/giving/donate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { stripeGivingService } from '@/services/giving/stripe.service'
import { givingAnalytics } from '@/services/analytics/giving'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      tenantId,
      amount,
      paymentMethodId,
      fundId,
      campaignId,
      frequency,
      email,
      name,
      phone,
      coversFees,
      memo,
      isAnonymous,
    } = body

    // Validate required fields
    if (!tenantId || !amount || !paymentMethodId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create donor
    let donorId: string | undefined
    const donor = await prisma.donor.findFirst({
      where: { tenantId, email },
    })

    if (donor) {
      donorId = donor.id
    } else {
      const [firstName, ...lastNameParts] = (name || '').split(' ')
      const newDonor = await prisma.donor.create({
        data: {
          tenantId,
          email,
          firstName: firstName || 'Guest',
          lastName: lastNameParts.join(' ') || 'Donor',
          phone,
        },
      })
      donorId = newDonor.id
    }

    // Process based on frequency
    if (frequency === 'one-time') {
      // One-time donation
      const result = await stripeGivingService.processOneTimeDonation({
        tenantId,
        amount,
        currency: 'USD',
        fundId,
        campaignId,
        donorId,
        paymentMethodId,
        email,
        name,
        coversFees,
        memo,
      })

      // Track analytics
      await givingAnalytics.trackDonation({
        tenantId,
        donorId,
        amount,
        fundId,
        campaignId,
        source: 'WEBSITE',
        paymentMethod: 'CARD',
      })

      // Check if payment requires action (3DS)
      if (result.paymentIntent.status === 'requires_action') {
        return NextResponse.json({
          requiresAction: true,
          clientSecret: result.paymentIntent.client_secret,
          donationId: result.donation.id,
        })
      }

      return NextResponse.json({
        success: true,
        donation: result.donation,
      })
    } else {
      // Recurring donation
      const frequencyMap: Record<string, any> = {
        weekly: 'WEEKLY',
        monthly: 'MONTHLY',
        quarterly: 'QUARTERLY',
        annually: 'ANNUALLY',
      }

      const recurring = await stripeGivingService.createRecurringDonation({
        tenantId,
        donorId: donorId!,
        amount,
        currency: 'USD',
        fundId,
        frequency: frequencyMap[frequency],
        paymentMethodId,
        coversFees,
      })

      return NextResponse.json({
        success: true,
        recurringDonation: recurring,
      })
    }
  } catch (error) {
    console.error('Donation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment failed' },
      { status: 500 }
    )
  }
}
```

### Text-to-Give Processing

```typescript
// app/api/giving/text/route.ts

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/db/prisma'
import { stripeGivingService } from '@/services/giving/stripe.service'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = (formData.get('Body') as string).trim().toUpperCase()

    // Parse the text message
    // Format: GIVE [amount] [fund code]
    // Examples: "GIVE 100", "GIVE 50 MISSIONS"
    const match = body.match(/^GIVE\s+(\d+(?:\.\d{2})?)\s*(\w+)?$/i)

    if (!match) {
      // Send help message
      return sendSMS(from, 'To give, text: GIVE [amount] [fund]. Example: GIVE 100 GENERAL')
    }

    const amount = parseFloat(match[1])
    const fundCode = match[2]

    // Look up donor by phone
    const donor = await prisma.donor.findFirst({
      where: { phone: from },
      include: {
        paymentMethods: { where: { isDefault: true } },
      },
    })

    if (!donor) {
      // New donor - send registration link
      const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/giving/mobile-setup?phone=${encodeURIComponent(from)}`
      return sendSMS(
        from,
        `Welcome! To start giving via text, please set up your account: ${registrationUrl}`
      )
    }

    if (donor.paymentMethods.length === 0) {
      // No payment method on file
      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/giving/add-payment?donor=${donor.id}`
      return sendSMS(
        from,
        `Please add a payment method to give via text: ${setupUrl}`
      )
    }

    // Find fund
    let fundId: string | undefined
    if (fundCode) {
      const fund = await prisma.givingFund.findFirst({
        where: {
          tenantId: donor.tenantId,
          OR: [
            { code: fundCode },
            { name: { contains: fundCode, mode: 'insensitive' } },
          ],
          isActive: true,
        },
      })
      fundId = fund?.id
    }

    // Process donation
    const result = await stripeGivingService.processOneTimeDonation({
      tenantId: donor.tenantId,
      amount,
      currency: 'USD',
      fundId,
      donorId: donor.id,
      paymentMethodId: donor.paymentMethods[0].processorId,
      email: donor.email,
      name: `${donor.firstName} ${donor.lastName}`,
      metadata: { source: 'TEXT' },
    })

    // Send confirmation
    const fundName = fundId
      ? (await prisma.givingFund.findUnique({ where: { id: fundId } }))?.name
      : 'General Fund'

    return sendSMS(
      from,
      `Thank you! Your gift of $${amount.toFixed(2)} to ${fundName} has been received. Receipt sent to ${donor.email}.`
    )
  } catch (error) {
    console.error('Text-to-give error:', error)
    return sendSMS(
      request.body.From,
      'Sorry, we could not process your gift. Please try again or contact the church office.'
    )
  }
}

function sendSMS(to: string, message: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${message}</Message>
    </Response>`,
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  )
}
```

---

## Admin Dashboard

### Giving Dashboard Component

```typescript
// components/admin/giving/GivingDashboard.tsx

'use client'

import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Heart,
} from 'lucide-react'
import { GivingChart } from './GivingChart'
import { DonationTable } from './DonationTable'
import { FundBreakdown } from './FundBreakdown'
import { TopDonors } from './TopDonors'
import { RecurringOverview } from './RecurringOverview'

interface GivingDashboardProps {
  stats: {
    totalGiving: number
    totalGivingChange: number
    donorCount: number
    donorCountChange: number
    avgDonation: number
    avgDonationChange: number
    recurringCount: number
    recurringTotal: number
  }
  chartData: {
    date: string
    amount: number
  }[]
  recentDonations: any[]
  fundBreakdown: any[]
  topDonors: any[]
}

export function GivingDashboard({
  stats,
  chartData,
  recentDonations,
  fundBreakdown,
  topDonors,
}: GivingDashboardProps) {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Giving Dashboard</h1>
          <p className="text-muted-foreground">
            Track donations and manage giving programs
          </p>
        </div>
        <div className="flex gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Giving"
          value={`$${stats.totalGiving.toLocaleString()}`}
          change={stats.totalGivingChange}
          icon={DollarSign}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Unique Donors"
          value={stats.donorCount.toString()}
          change={stats.donorCountChange}
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Average Gift"
          value={`$${stats.avgDonation.toFixed(2)}`}
          change={stats.avgDonationChange}
          icon={TrendingUp}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Recurring Gifts"
          value={stats.recurringCount.toString()}
          subValue={`$${stats.recurringTotal.toLocaleString()}/mo`}
          icon={RefreshCw}
          iconColor="text-orange-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Giving Trends</CardTitle>
            <CardDescription>
              Daily giving over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GivingChart data={chartData} />
          </CardContent>
        </Card>

        {/* Fund Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>By Fund</CardTitle>
            <CardDescription>
              Distribution across giving funds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FundBreakdown data={fundBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="donations">
        <TabsList>
          <TabsTrigger value="donations">Recent Donations</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Gifts</TabsTrigger>
          <TabsTrigger value="donors">Top Donors</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <DonationTable donations={recentDonations} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          <RecurringOverview />
        </TabsContent>

        <TabsContent value="donors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Donors</CardTitle>
              <CardDescription>
                Highest givers this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopDonors donors={topDonors} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  change?: number
  subValue?: string
  icon: React.ElementType
  iconColor: string
}

function StatsCard({
  title,
  value,
  change,
  subValue,
  icon: Icon,
  iconColor,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '+' : ''}{change}% from last period
              </p>
            )}
            {subValue && (
              <p className="text-sm text-muted-foreground">{subValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gray-100 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Receipt Generation

```typescript
// services/giving/receipt.service.ts

import { Resend } from 'resend'
import { prisma } from '@/lib/db/prisma'
import { format } from 'date-fns'
import { ReceiptEmailTemplate } from '@/emails/receipt-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export class ReceiptService {
  /**
   * Send donation receipt
   */
  async sendReceipt(donationId: string) {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        tenant: {
          select: {
            name: true,
            settings: true,
            theme: true,
          },
        },
        donor: true,
        fund: true,
      },
    })

    if (!donation) throw new Error('Donation not found')

    const email = donation.donor?.email || donation.guestEmail
    if (!email) throw new Error('No email address for receipt')

    const tenantSettings = donation.tenant.settings as any
    const receiptNumber = await this.generateReceiptNumber(donation.tenantId)

    // Update donation with receipt info
    await prisma.donation.update({
      where: { id: donationId },
      data: {
        receiptSent: true,
        receiptSentAt: new Date(),
        receiptNumber,
      },
    })

    // Send email
    await resend.emails.send({
      from: tenantSettings?.givingEmail || `giving@${donation.tenant.name.toLowerCase().replace(/\s+/g, '')}.church`,
      to: email,
      subject: `Thank You for Your Gift - ${donation.tenant.name}`,
      react: ReceiptEmailTemplate({
        churchName: donation.tenant.name,
        donorName: donation.donor
          ? `${donation.donor.firstName} ${donation.donor.lastName}`
          : donation.guestName || 'Friend',
        amount: Number(donation.amount),
        date: donation.createdAt,
        fundName: donation.fund?.name || 'General Fund',
        receiptNumber,
        isTaxDeductible: donation.fund?.isTaxDeductible ?? true,
        churchAddress: tenantSettings?.address,
        churchEIN: tenantSettings?.ein,
        logoUrl: (donation.tenant.theme as any)?.logoUrl,
      }),
    })

    return { receiptNumber, email }
  }

  /**
   * Generate annual giving statement
   */
  async generateAnnualStatement(donorId: string, year: number) {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      include: {
        tenant: {
          select: {
            name: true,
            settings: true,
          },
        },
      },
    })

    if (!donor) throw new Error('Donor not found')

    const donations = await prisma.donation.findMany({
      where: {
        donorId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { fund: true },
      orderBy: { createdAt: 'asc' },
    })

    const totalGiving = donations.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )

    const byFund = donations.reduce((acc, d) => {
      const fundName = d.fund?.name || 'General Fund'
      acc[fundName] = (acc[fundName] || 0) + Number(d.amount)
      return acc
    }, {} as Record<string, number>)

    return {
      donor: {
        name: `${donor.firstName} ${donor.lastName}`,
        email: donor.email,
        address: donor.address,
      },
      church: {
        name: donor.tenant.name,
        settings: donor.tenant.settings,
      },
      year,
      totalGiving,
      byFund,
      donations: donations.map(d => ({
        date: d.createdAt,
        amount: Number(d.amount),
        fund: d.fund?.name || 'General Fund',
        receiptNumber: d.receiptNumber,
      })),
    }
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const count = await prisma.donation.count({
      where: {
        tenantId,
        receiptNumber: { not: null },
        createdAt: { gte: new Date(year, 0, 1) },
      },
    })

    return `${year}-${String(count + 1).padStart(6, '0')}`
  }
}

export const receiptService = new ReceiptService()
```

---

## Best Practices

### For Churches

1. **Fund Organization**: Create clear, specific funds for transparency
2. **Goal Setting**: Set realistic campaign goals with deadlines
3. **Communication**: Send regular giving updates to donors
4. **Thank You**: Always send personalized thank you messages
5. **Year-End**: Send annual giving statements in January

### For Developers

1. **PCI Compliance**: Never store raw card data
2. **Idempotency**: Use idempotency keys for all payment operations
3. **Error Handling**: Graceful degradation for payment failures
4. **Webhooks**: Handle Stripe webhooks for payment confirmations
5. **Audit Trail**: Log all financial transactions

### Security Considerations

- All payment forms use HTTPS/TLS 1.3
- Stripe Elements for secure card input
- No card data touches our servers
- Webhook signature verification
- Rate limiting on donation endpoints
- Fraud detection integration

---

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| One-Time Giving | Complete | Card, ACH, Apple/Google Pay |
| Recurring Giving | Complete | Weekly/Monthly/Quarterly/Annually |
| Text-to-Give | Complete | Twilio integration |
| Campaigns | Complete | Goals, progress, deadlines |
| Fund Management | Complete | Unlimited funds |
| Donor Management | Complete | Profiles, history, statements |
| Receipt Generation | Complete | Email + PDF |
| Batch Import | Complete | CSV/QuickBooks import |
| Kiosk Mode | Complete | Touch-optimized interface |
| Reporting | Complete | Dashboards + exports |

**Processing Fees**: 2.0% + $0.25 (card), 0.5% (ACH) - Industry leading rates
