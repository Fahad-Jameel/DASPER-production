# gemini_report_generator.py - AI-Powered Report Generation using Gemini
import os
import logging
import google.generativeai as genai
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors

logger = logging.getLogger(__name__)

class GeminiReportGenerator:
    """Generate AI-powered assessment reports using Google Gemini"""
    
    def __init__(self):
        self.gemini_model = None
        self.initialized = self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize Gemini API"""
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                logger.warning("⚠️ GEMINI_API_KEY not found")
                return False
            
            genai.configure(api_key=api_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("✅ Gemini report generator initialized")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini: {e}")
            return False
    
    def generate_ai_report(self, assessment):
        """Generate AI-powered report using Gemini"""
        try:
            if not self.initialized or not self.gemini_model:
                logger.warning("⚠️ Gemini not available, using fallback")
                return self._generate_fallback_report(assessment)
            
            # Prepare assessment data for Gemini
            assessment_data = self._prepare_assessment_data(assessment)
            
            # Create prompt for Gemini
            prompt = self._create_report_prompt(assessment_data)
            
            # Generate report with Gemini
            logger.info("🤖 Generating AI report with Gemini...")
            response = self.gemini_model.generate_content(prompt)
            
            # Extract report text
            report_text = response.text
            
            logger.info("✅ AI report generated successfully")
            return report_text
            
        except Exception as e:
            logger.error(f"❌ Error generating AI report: {e}")
            return self._generate_fallback_report(assessment)
    
    def _prepare_assessment_data(self, assessment):
        """Prepare assessment data for Gemini"""
        damage_assessment = assessment.get('damage_assessment', {})
        cost_estimation = assessment.get('cost_estimation', {})
        building_info = assessment.get('building_info', {})
        
        return {
            'building_name': assessment.get('building_name', 'Unknown'),
            'building_type': assessment.get('building_type', 'Unknown'),
            'location': assessment.get('pin_location', 'Unknown'),
            'assessment_date': assessment.get('timestamp', datetime.now()).strftime('%Y-%m-%d %H:%M:%S'),
            'building_area': assessment.get('estimated_building_area_sqm', 0),
            'building_height': assessment.get('building_height_m', 0),
            'building_volume': assessment.get('building_volume_cubic_m', 0),
            'severity_score': damage_assessment.get('severity_score', 0),
            'severity_category': damage_assessment.get('severity_category', 'Unknown'),
            'damage_percentage': assessment.get('damage_percentage', 0),
            'confidence': damage_assessment.get('confidence', 0),
            'total_cost': cost_estimation.get('total_estimated_cost_pkr', 0),
            'structural_cost': cost_estimation.get('structural_cost', 0),
            'non_structural_cost': cost_estimation.get('non_structural_cost', 0),
            'content_cost': cost_estimation.get('content_cost', 0),
            'repair_time_days': cost_estimation.get('repair_time_days', 0),
            'recommendations': assessment.get('recommendations', []),
            'damage_types': assessment.get('damage_types', [])
        }
    
    def _create_report_prompt(self, data):
        """Create prompt for Gemini to generate report"""
        prompt = f"""
You are an expert structural engineer and disaster assessment specialist. Generate a comprehensive, professional damage assessment report based on the following data.

ASSESSMENT DATA:
- Building Name: {data['building_name']}
- Building Type: {data['building_type']}
- Location: {data['location']}
- Assessment Date: {data['assessment_date']}
- Building Area: {data['building_area']:.2f} square meters
- Building Height: {data['building_height']:.2f} meters
- Building Volume: {data['building_volume']:.2f} cubic meters
- Damage Severity Score: {data['severity_score']:.3f} ({data['severity_category']})
- Damage Percentage: {data['damage_percentage']:.1f}%
- Assessment Confidence: {data['confidence']:.1%}
- Damage Types: {', '.join(data['damage_types']) if data['damage_types'] else 'Not specified'}

COST ESTIMATION:
- Total Estimated Cost: {data['total_cost']:,.2f} PKR
- Structural Repair Cost: {data['structural_cost']:,.2f} PKR
- Non-Structural Repair Cost: {data['non_structural_cost']:,.2f} PKR
- Content Replacement Cost: {data['content_cost']:,.2f} PKR
- Estimated Repair Time: {data['repair_time_days']} days

RECOMMENDATIONS: {', '.join(data['recommendations']) if data['recommendations'] else 'None provided'}

INSTRUCTIONS:
Generate a professional, detailed damage assessment report in plain text format (NO icons, NO emojis, NO special characters). The report should include:

1. EXECUTIVE SUMMARY
   - Brief overview of the assessment
   - Key findings and severity classification
   - Immediate action recommendations

2. BUILDING INFORMATION
   - Complete building details
   - Location and structural characteristics
   - Assessment methodology

3. DAMAGE ASSESSMENT
   - Detailed analysis of damage severity
   - Damage types identified
   - Structural integrity assessment
   - Confidence level in assessment

4. COST ESTIMATION
   - Detailed cost breakdown
   - Cost components explanation
   - Repair timeline
   - Cost justification

5. RECOMMENDATIONS
   - Immediate actions required
   - Short-term repair priorities
   - Long-term structural considerations
   - Safety recommendations

6. CONCLUSION
   - Summary of findings
   - Overall assessment
   - Next steps

Format the report professionally with clear sections, proper headings, and detailed explanations. Use only plain text - no icons, emojis, or special formatting characters. Make it suitable for official documentation and professional use.
"""
        return prompt
    
    def _generate_fallback_report(self, assessment):
        """Generate fallback report if Gemini is unavailable"""
        data = self._prepare_assessment_data(assessment)
        
        # Define newline character outside f-string to avoid syntax error
        newline = '\n'
        
        # Format damage types
        if data['damage_types']:
            damage_types_text = newline.join(f"- {dt}" for dt in data['damage_types'])
        else:
            damage_types_text = "- Not specified"
        
        # Format recommendations
        if data['recommendations']:
            recommendations_text = newline.join(f"- {rec}" for rec in data['recommendations'])
        else:
            recommendations_text = "- Professional structural inspection recommended\n- Immediate safety assessment required\n- Detailed repair planning needed"
        
        report = f"""
DASPER - DISASTER ASSESSMENT & STRUCTURAL PERFORMANCE EVALUATION REPORT

================================================================================
EXECUTIVE SUMMARY
================================================================================

This report presents a comprehensive damage assessment for the building located at {data['location']}. The assessment was conducted on {data['assessment_date']} using advanced AI-powered analysis techniques.

Key Findings:
- Building Name: {data['building_name']}
- Building Type: {data['building_type']}
- Damage Severity: {data['severity_category']} ({data['damage_percentage']:.1f}% damage)
- Assessment Confidence: {data['confidence']:.1%}
- Total Estimated Repair Cost: {data['total_cost']:,.2f} PKR
- Estimated Repair Time: {data['repair_time_days']} days

================================================================================
BUILDING INFORMATION
================================================================================

Building Name: {data['building_name']}
Building Type: {data['building_type']}
Location: {data['location']}
Assessment Date: {data['assessment_date']}

Building Dimensions:
- Total Area: {data['building_area']:.2f} square meters
- Building Height: {data['building_height']:.2f} meters
- Building Volume: {data['building_volume']:.2f} cubic meters

================================================================================
DAMAGE ASSESSMENT
================================================================================

Severity Classification: {data['severity_category']}
Severity Score: {data['severity_score']:.3f} (on a scale of 0.0 to 1.0)
Damage Percentage: {data['damage_percentage']:.1f}%
Assessment Confidence: {data['confidence']:.1%}

Damage Types Identified:
{damage_types_text}

Structural Integrity Assessment:
Based on the damage severity score of {data['severity_score']:.3f}, this building has been classified as {data['severity_category']} damage. The assessment confidence level of {data['confidence']:.1%} indicates a reliable evaluation of the building's condition.

================================================================================
COST ESTIMATION
================================================================================

Total Estimated Repair Cost: {data['total_cost']:,.2f} PKR

Cost Breakdown:
- Structural Repairs: {data['structural_cost']:,.2f} PKR
- Non-Structural Repairs: {data['non_structural_cost']:,.2f} PKR
- Content Replacement: {data['content_cost']:,.2f} PKR

Estimated Repair Timeline: {data['repair_time_days']} days

Cost Justification:
The cost estimation is based on current Pakistan construction market rates, including material costs, labor costs, and regional factors. The breakdown reflects the extent of damage and the required repair work for each component.

================================================================================
RECOMMENDATIONS
================================================================================

{recommendations_text}

================================================================================
CONCLUSION
================================================================================

This assessment indicates {data['severity_category']} damage to the building structure. The estimated repair cost of {data['total_cost']:,.2f} PKR reflects the comprehensive work required to restore the building to a safe and functional condition.

It is recommended that a qualified structural engineer conduct a detailed on-site inspection to validate these findings and develop a detailed repair plan.

Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Generated by: DASPER - Disaster Assessment & Structural Performance Evaluation System
"""
        return report
    
    def generate_pdf_from_text(self, report_text, assessment_id, output_path):
        """Convert text report to PDF"""
        try:
            # Create PDF document
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # Define styles
            styles = getSampleStyleSheet()
            
            # Title style
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#1a237e')
            )
            
            # Heading style
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                spaceBefore=12,
                textColor=colors.HexColor('#1a237e')
            )
            
            # Body style
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=8,
                alignment=TA_JUSTIFY,
                leading=14
            )
            
            # Split report into lines and process
            lines = report_text.split('\n')
            
            for line in lines:
                line = line.strip()
                
                if not line:
                    story.append(Spacer(1, 6))
                    continue
                
                # Check for section headers (lines with === or all caps)
                if line.startswith('===') or (line.isupper() and len(line) > 10):
                    if line.startswith('==='):
                        continue  # Skip separator lines
                    story.append(Paragraph(line, heading_style))
                    story.append(Spacer(1, 8))
                elif line.startswith('DASPER') or 'REPORT' in line.upper():
                    story.append(Paragraph(line, title_style))
                    story.append(Spacer(1, 12))
                else:
                    # Regular text
                    story.append(Paragraph(line, body_style))
            
            # Build PDF
            doc.build(story)
            logger.info(f"✅ PDF generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Error generating PDF: {e}")
            raise
