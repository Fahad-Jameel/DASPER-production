import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LandingPage = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={32} color="#2563eb" />
            <Text style={styles.logoText}>SenseEd</Text>
          </View>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#f8fafc', '#e2e8f0']}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Transform Your Teaching Recruitment with AI
            </Text>
            <Text style={styles.heroSubtitle}>
              Revolutionize teacher hiring through intelligent emotion analysis and data-driven insights
            </Text>
            
            <View style={styles.featuresContainer}>
              {[
                'Objective evaluation of teaching candidates',
                'Data-driven hiring decisions',
                'Actionable feedback for skill improvement',
                'Reduced recruitment bias',
                'Enhanced teaching quality assessment',
                'Scalable evaluation process'
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn More</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Performance Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={24} color="#3b82f6" />
                <Text style={styles.metricTitle}>Confidence</Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '92%' }]} />
                </View>
                <Text style={styles.metricScore}>9.2/10</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
                <Text style={styles.metricTitle}>Communication</Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '84%', backgroundColor: '#8b5cf6' }]} />
                </View>
                <Text style={styles.metricScore}>8.4/10</Text>
              </View>
            </View>

            <View style={styles.graduationIcon}>
              <Ionicons name="school" size={48} color="#10b981" />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#1e40af', '#7c3aed']}
        style={styles.ctaSection}
      >
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>
            Ready to Transform Your Hiring Process?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Start using SenseEd today and discover how AI-powered emotion analysis can revolutionize your teacher recruitment process.
          </Text>
          <TouchableOpacity style={styles.getStartedButton}>
            <Text style={styles.getStartedText}>Get Started Now</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrand}>
            <View style={styles.footerLogo}>
              <Ionicons name="school" size={24} color="#2563eb" />
              <Text style={styles.footerLogoText}>SenseEd</Text>
            </View>
            <Text style={styles.footerDescription}>
              Revolutionizing teacher recruitment through AI-powered emotion analysis. Building better educational futures, one assessment at a time.
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactItem}>contact@senseed.ai</Text>
              <Text style={styles.contactItem}>+92 123-4567</Text>
              <Text style={styles.contactItem}>Islamabad, PK</Text>
            </View>
          </View>

          <View style={styles.footerLinks}>
            <View style={styles.linkColumn}>
              <Text style={styles.linkTitle}>Product</Text>
              {['Analysis', 'Features', 'Pricing', 'API Docs'].map((link, index) => (
                <TouchableOpacity key={index} style={styles.linkItem}>
                  <Text style={styles.linkText}>{link}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.linkColumn}>
              <Text style={styles.linkTitle}>Company</Text>
              {['About Us', 'Careers', 'Blog', 'Press'].map((link, index) => (
                <TouchableOpacity key={index} style={styles.linkItem}>
                  <Text style={styles.linkText}>{link}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.linkColumn}>
              <Text style={styles.linkTitle}>Support</Text>
              {['Help Center', 'Contact', 'Status', 'Updates'].map((link, index) => (
                <TouchableOpacity key={index} style={styles.linkItem}>
                  <Text style={styles.linkText}>{link}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.newsletterSection}>
            <Text style={styles.newsletterTitle}>Stay Updated</Text>
            <Text style={styles.newsletterSubtitle}>
              Get the latest updates on AI-powered education technology
            </Text>
            <View style={styles.emailInput}>
              <Text style={styles.emailPlaceholder}>Enter your email</Text>
              <TouchableOpacity style={styles.subscribeButton}>
                <Ionicons name="send" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footerBottom}>
          <Text style={styles.copyright}>© 2025 SenseEd. All rights reserved.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    flex: 1,
  },
  heroGradient: {
    padding: 30,
    minHeight: height * 0.7,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#64748b',
    lineHeight: 26,
    marginBottom: 40,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  learnMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  metricsContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  metricScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  graduationIcon: {
    alignItems: 'center',
    marginTop: 20,
  },
  ctaSection: {
    padding: 40,
    alignItems: 'center',
  },
  ctaContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  footer: {
    backgroundColor: '#0f172a',
    padding: 30,
  },
  footerContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  footerBrand: {
    flex: 1,
    minWidth: 300,
    marginBottom: 30,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
    marginLeft: 8,
  },
  footerDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  footerLinks: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    minWidth: 300,
  },
  linkColumn: {
    flex: 1,
    marginHorizontal: 10,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  linkItem: {
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  newsletterSection: {
    flex: 1,
    minWidth: 300,
    marginTop: 20,
  },
  newsletterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  newsletterSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  emailInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emailPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  subscribeButton: {
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 6,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 20,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default LandingPage;
