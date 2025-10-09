# Email Deliverability Guide for NexGen

## 🚀 **Current Status**
- ✅ Emails are sending successfully via Resend
- ✅ Domain `nexgencrypto.live` is verified in Resend
- ⚠️ Emails landing in Gmail spam folder

## 🔧 **Immediate Fixes Applied**
1. **Fixed domain inconsistency**: Email footer now uses `support@nexgencrypto.live` instead of `support@nexgen.com`
2. **Removed spam-triggering emoji** from email subject
3. **Improved subject line** to be more professional
4. **Added proper email headers** for better deliverability

## 📋 **DNS Setup Required (Critical for Deliverability)**

### 1. **SPF Record**
Add this TXT record to your DNS:
```
Type: TXT
Name: @
Value: "v=spf1 include:_spf.resend.com ~all"
```

### 2. **DKIM Records**
Resend provides these automatically. In your Resend dashboard:
- Go to Domains → `nexgencrypto.live` → DNS Records
- Add the provided DKIM TXT records to your DNS

### 3. **DMARC Record** (Recommended)
```
Type: TXT
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@nexgencrypto.live"
```

## 🏆 **Domain Reputation Building**

### **Phase 1: Warm Up (Days 1-7)**
- Send 5-10 emails per day to engaged recipients
- Monitor open rates and spam complaints
- Gradually increase volume

### **Phase 2: Steady Growth (Days 8-30)**
- Increase to 20-50 emails per day
- Focus on quality recipients (actual users)
- Monitor deliverability metrics

### **Phase 3: Full Volume (Day 31+)**
- Scale up based on engagement
- Maintain <0.1% spam complaint rate

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track:**
- **Deliverability Rate**: % of emails reaching inbox
- **Open Rate**: % of delivered emails opened
- **Click Rate**: % of emails with link clicks
- **Spam Complaint Rate**: Keep <0.1%
- **Bounce Rate**: Hard bounces <2%, Soft bounces <5%

### **Tools to Use:**
- **Resend Dashboard**: Built-in analytics
- **Gmail Postmaster Tools**: Check domain reputation
- **Mail-tester.com**: Test email quality

## 🎯 **Content Best Practices**

### **✅ Do:**
- Use clear, descriptive subject lines
- Include physical mailing address (if applicable)
- Add unsubscribe links (we've added List-Unsubscribe header)
- Send from verified domains only
- Authenticate all links and images

### **❌ Don't:**
- Use ALL CAPS in subject lines
- Include too many images
- Use spam trigger words: "free", "guarantee", "urgent", "act now"
- Send to purchased email lists
- Send emails to unengaged recipients

## 🔍 **Testing & Troubleshooting**

### **Test Your Setup:**
1. Send test emails to multiple Gmail accounts
2. Check different email providers (Outlook, Yahoo, etc.)
3. Use mail-tester.com to score your emails
4. Monitor Resend analytics

### **Common Issues:**
- **Missing DNS records**: Check with tools like mxtoolbox.com
- **Poor domain reputation**: Build gradually, focus on quality
- **Content triggers**: Review email content for spam patterns
- **IP reputation**: Resend manages this, but domain matters

## 📞 **Next Steps**

1. **Immediate**: Add SPF, DKIM, and DMARC records to DNS
2. **Short-term**: Monitor deliverability metrics in Resend dashboard
3. **Long-term**: Build domain reputation through consistent, quality sending

## 🆘 **Need Help?**
- Check Resend documentation: https://resend.com/docs
- Use Gmail Postmaster Tools: https://postmaster.google.com
- Test with mail-tester.com

---

**Remember**: Email deliverability is a long-term game. Focus on building trust with email providers through consistent, quality sending practices.