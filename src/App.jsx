
import { useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const WEB3FORMS_ACCESS_KEY =
  import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || "";

const images = {
  hero: "/images/maxtech-hero.jpg",
  about: "/images/maxtech-about.jpg",

  services: {
    sales: "/images/service-printer-sales.jpg",
    repair: "/images/service-printer-repair.jpg",
    maintenance: "/images/service-maintenance.jpg",
    document: "/images/service-document-management.jpg",
    parts: "/images/service-parts-consumables.jpg",
    office: "/images/service-office-solutions.jpg",
  },

  solutions: {
    printManagement: "/images/solution-print-management.jpg",
    workflow: "/images/solution-document-workflow.jpg",
    managedPrint: "/images/solution-managed-print.jpg",
    continuity: "/images/solution-business-continuity.jpg",
  },

  products: {
    monochrome: "/images/product-monochrome-bizhub.jpg",
    colour: "/images/product-colour-bizhub.jpg",
    document: "/images/product-document-management.jpg",
  },

  technician: "/images/maxtech-technician.jpg",
  contact: "/images/maxtech-contact.jpg",
};

const initialFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  service: "",
  message: "",
};

const serviceLabels = {
  "printer-sales": "Printer Sales",
  "printer-repair": "Printer Repair",
  maintenance: "Maintenance & Service",
  "document-management": "Document Management",
  parts: "Parts & Consumables",
  other: "Other",
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  const [formStatus, setFormStatus] = useState({
    type: "",
    message: "",
    reference: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formStatus.type) {
      setFormStatus({
        type: "",
        message: "",
        reference: "",
      });
    }
  };

  /*
   * =========================================
   * FORM VALIDATION
   * =========================================
   */
  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const service = formData.service;
    const message = formData.message.trim();

    if (!name) {
      return "Please enter your full name.";
    }

    if (name.length < 2) {
      return "Please enter a valid full name.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return "Please enter your email address.";
    }

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");

      if (phoneDigits.length < 7) {
        return "Please enter a valid phone number.";
      }
    }

    if (!service) {
      return "Please select the service you need.";
    }

    if (!message) {
      return "Please enter a message describing what you need.";
    }

    if (message.length < 10) {
      return "Please provide a little more detail in your message.";
    }

    if (message.length > 2000) {
      return "Your message is too long. Please keep it under 2,000 characters.";
    }

    return "";
  };

  /*
   * =========================================
   * WEB3FORMS
   * =========================================
   */
  const sendToWeb3Forms = async (payload, reference) => {
    if (!WEB3FORMS_ACCESS_KEY) {
      throw new Error(
        "Web3Forms is not configured. Please check the frontend .env file."
      );
    }

    const serviceName =
      serviceLabels[payload.service] ||
      payload.service ||
      "General Enquiry";

    const web3Payload = {
      access_key: WEB3FORMS_ACCESS_KEY,

      subject: `New MAXTECH VENTURES Enquiry - ${serviceName}`,

      from_name: "MAXTECH VENTURES Website",

      name: payload.name,

      company: payload.company || "Not provided",

      email: payload.email,

      phone: payload.phone || "Not provided",

      service: serviceName,

      message: payload.message,

      reference: reference || "Not available",

      source: "MAXTECH VENTURES Website",

      replyto: payload.email,

      botcheck: "",
    };

    console.log("Sending notification through Web3Forms...");

    const response = await fetch(
      "https://api.web3forms.com/submit",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify(web3Payload),
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log("Web3Forms response:", {
      status: response.status,
      data,
    });

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Web3Forms request failed with HTTP ${response.status}.`
      );
    }

    if (data.success === false) {
      throw new Error(
        data.message ||
          "Web3Forms could not process the notification."
      );
    }

    return data;
  };

  /*
   * =========================================
   * FORM SUBMISSION
   * =========================================
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormStatus({
      type: "",
      message: "",
      reference: "",
    });

    /*
     * Validate before making any network request.
     */
    const validationError = validateForm();

    if (validationError) {
      setFormStatus({
        type: "error",
        message: validationError,
        reference: "",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        service: formData.service,
        message: formData.message.trim(),

        // Honeypot deliberately remains empty.
        website: "",
      };

      console.log("Submitting contact form:", payload);

      /*
       * =========================================
       * STEP 1
       * Save enquiry to MAXTECH backend.
       * =========================================
       */
      const backendResponse = await fetch(
        `${API_URL}/contact`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      let backendData = {};

      try {
        backendData = await backendResponse.json();
      } catch {
        backendData = {};
      }

      console.log("Backend response:", {
        status: backendResponse.status,
        data: backendData,
      });

      if (!backendResponse.ok || !backendData.success) {
        throw new Error(
          backendData.message ||
            "We could not save your request. Please try again."
        );
      }

      const reference = backendData.reference || "";

      /*
       * =========================================
       * STEP 2
       * Send notification through Web3Forms.
       * =========================================
       */
      try {
        await sendToWeb3Forms(payload, reference);

        /*
         * Backend storage + Web3Forms succeeded.
         */
        setFormStatus({
          type: "success",
          message:
            "Your request has been received successfully. Our team will contact you shortly.",
          reference,
        });
      } catch (web3Error) {
        /*
         * The backend already saved the enquiry.
         *
         * Therefore Web3Forms failure must not make
         * the customer believe the enquiry was lost.
         */
        console.error(
          "Web3Forms notification error:",
          web3Error
        );

        setFormStatus({
          type: "success",
          message:
            "Your enquiry has been received and saved successfully. Our team will contact you shortly.",
          reference,
        });
      }

      /*
       * Clear the form after successful backend submission.
       */
      setFormData(initialFormData);

      /*
       * Scroll the success message into view.
       */
      window.setTimeout(() => {
        const successMessage = document.querySelector(
          ".form-message-success"
        );

        if (successMessage) {
          successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    } catch (error) {
      console.error(
        "Contact form submission error:",
        error
      );

      setFormStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while sending your request. Please try again.",
        reference: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app">
      {/* =========================
          NAVIGATION
      ========================== */}
      <header className="site-header">
        <div className="container nav-container">
          <a
            href="#home"
            className="logo"
            onClick={closeMenu}
          >
            <div className="logo-mark">
              <span>M</span>
            </div>

            <div className="logo-text">
              <strong>MAXTECH</strong>
              <span>VENTURES</span>
            </div>
          </a>

          <button
            className={`menu-toggle ${
              menuOpen ? "active" : ""
            }`}
            onClick={() =>
              setMenuOpen((previous) => !previous)
            }
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            type="button"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav
            className={`main-nav ${
              menuOpen ? "open" : ""
            }`}
          >
            <a href="#home" onClick={closeMenu}>
              Home
            </a>

            <a href="#about" onClick={closeMenu}>
              About
            </a>

            <a href="#services" onClick={closeMenu}>
              Services
            </a>

            <a href="#solutions" onClick={closeMenu}>
              Solutions
            </a>

            <a href="#products" onClick={closeMenu}>
              Products
            </a>

            <a
              href="#contact"
              className="nav-quote"
              onClick={closeMenu}
            >
              Request a Quote
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* =========================
            HERO
        ========================== */}
        <section className="hero" id="home">
          <div className="hero-image">
            <img
              src={images.hero}
              alt="Modern business office printer and document management environment"
              fetchPriority="high"
            />
          </div>

          <div className="hero-overlay"></div>

          <div className="container hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                Printer &amp; Document Management Solutions
              </div>

              <h1>
                Smart Printing.
                <br />
                <span>Better Business.</span>
              </h1>

              <p>
                MAXTECH VENTURES provides professional printer
                sales, repairs, maintenance and document
                management solutions for businesses of all
                sizes.
              </p>

              <p>
                We specialize in{" "}
                <strong>Konica Minolta bizhub</strong> printers
                and multifunctional office solutions.
              </p>

              <div className="hero-buttons">
                <a
                  href="#products"
                  className="btn btn-primary"
                >
                  Explore Printers
                  <span>→</span>
                </a>

                <a
                  href="#contact"
                  className="btn btn-outline"
                >
                  Request a Quote
                </a>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <strong>Professional</strong>
                  <span>Printer Solutions</span>
                </div>

                <div className="trust-divider"></div>

                <div className="trust-item">
                  <strong>Reliable</strong>
                  <span>Technical Support</span>
                </div>

                <div className="trust-divider"></div>

                <div className="trust-item">
                  <strong>Business</strong>
                  <span>Document Solutions</span>
                </div>
              </div>
            </div>

            <div className="hero-card">
              <img
                src={images.hero}
                alt="MAXTECH professional office printing solution"
              />

              <div className="hero-card-overlay">
                <div className="hero-card-top">
                  <span>MAXTECH</span>
                  <span>BUSINESS SOLUTIONS</span>
                </div>

                <div className="hero-card-bottom">
                  <strong>
                    Office Printing Solutions
                  </strong>

                  <span>
                    Sales • Service • Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            ABOUT
        ========================== */}
        <section
          className="about-intro section"
          id="about"
        >
          <div className="container about-grid">
            <div className="about-media">
              <img
                src={images.about}
                alt="MAXTECH printer and document management service"
                loading="lazy"
              />

              <div className="about-image-badge">
                <strong>MAXTECH</strong>
                <span>
                  Professional Office Solutions
                </span>
              </div>
            </div>

            <div className="about-content">
              <div className="section-label">
                <span>01</span>
                <p>ABOUT MAXTECH</p>
              </div>

              <h2>
                Your trusted partner for
                <span> professional printing.</span>
              </h2>

              <p>
                MAXTECH VENTURES is a printer and document
                management company focused on helping
                organizations build efficient, reliable and
                cost-effective printing environments.
              </p>

              <p>
                From supplying and installing multifunction
                printers to repairs, preventive maintenance
                and document workflow solutions, we help
                businesses keep their operations moving.
              </p>

              <a href="#contact" className="text-link">
                Talk to our team <span>→</span>
              </a>
            </div>
          </div>
        </section>

        {/* =========================
            SERVICES
        ========================== */}
        <section
          className="services section"
          id="services"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-label">
                  <span>02</span>
                  <p>WHAT WE DO</p>
                </div>

                <h2>
                  Complete printer
                  <span> solutions.</span>
                </h2>
              </div>

              <p>
                Whether you need a new office printer or
                technical support for your existing machines,
                MAXTECH VENTURES provides practical solutions
                designed around your business.
              </p>
            </div>

            <div className="services-grid">
              <article className="service-card">
                <div className="service-image">
                  <img
                    src={images.services.sales}
                    alt="Printer sales and office printing equipment"
                    loading="lazy"
                  />

                  <span className="service-number">
                    01
                  </span>
                </div>

                <div className="service-content">
                  <h3>Printer Sales</h3>

                  <p>
                    Supply of reliable multifunction
                    printers and office printing equipment
                    for businesses and organizations.
                  </p>

                  <a href="#contact">
                    Learn more →
                  </a>
                </div>
              </article>

              <article className="service-card featured">
                <div className="service-image">
                  <img
                    src={images.services.repair}
                    alt="Professional printer repair service"
                    loading="lazy"
                  />

                  <span className="service-number">
                    02
                  </span>
                </div>

                <div className="service-content">
                  <h3>Printer Repairs</h3>

                  <p>
                    Professional diagnosis, repairs and
                    technical support for Konica Minolta
                    bizhub printers and other office
                    equipment.
                  </p>

                  <a href="#contact">
                    Request service →
                  </a>
                </div>
              </article>

              <article className="service-card">
                <div className="service-image">
                  <img
                    src={images.services.maintenance}
                    alt="Printer maintenance and servicing"
                    loading="lazy"
                  />

                  <span className="service-number">
                    03
                  </span>
                </div>

                <div className="service-content">
                  <h3>Maintenance</h3>

                  <p>
                    Preventive maintenance programs designed
                    to reduce downtime and keep your printers
                    operating efficiently.
                  </p>

                  <a href="#contact">
                    Book maintenance →
                  </a>
                </div>
              </article>

              <article className="service-card">
                <div className="service-image">
                  <img
                    src={images.services.document}
                    alt="Digital document management solution"
                    loading="lazy"
                  />

                  <span className="service-number">
                    04
                  </span>
                </div>

                <div className="service-content">
                  <h3>Document Management</h3>

                  <p>
                    Modern document workflow solutions that
                    help businesses manage, organize and
                    control their printed documents.
                  </p>

                  <a href="#contact">
                    Explore solutions →
                  </a>
                </div>
              </article>

              <article className="service-card">
                <div className="service-image">
                  <img
                    src={images.services.parts}
                    alt="Printer parts toner and consumables"
                    loading="lazy"
                  />

                  <span className="service-number">
                    05
                  </span>
                </div>

                <div className="service-content">
                  <h3>Parts &amp; Consumables</h3>

                  <p>
                    Printer parts, toner and essential
                    consumables to keep your office printing
                    environment running smoothly.
                  </p>

                  <a href="#contact">
                    Contact us →
                  </a>
                </div>
              </article>

              <article className="service-card">
                <div className="service-image">
                  <img
                    src={images.services.office}
                    alt="Modern office printing solutions"
                    loading="lazy"
                  />

                  <span className="service-number">
                    06
                  </span>
                </div>

                <div className="service-content">
                  <h3>Office Solutions</h3>

                  <p>
                    Printing and workflow solutions tailored
                    to the needs of offices, schools,
                    organizations and growing businesses.
                  </p>

                  <a href="#contact">
                    Discuss your needs →
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =========================
            KONICA MINOLTA
        ========================== */}
        <section className="brand-section">
          <div className="container brand-container">
            <div className="brand-content">
              <div className="section-label light">
                <span>03</span>
                <p>KONICA MINOLTA BIZHUB</p>
              </div>

              <h2>
                Powerful printing for
                <span> modern workplaces.</span>
              </h2>

              <p>
                We specialize in Konica Minolta bizhub
                multifunctional printers, helping
                organizations select, install and maintain
                equipment that fits their printing
                requirements.
              </p>

              <div className="brand-features">
                <div>
                  <strong>Print</strong>
                  <span>
                    High-quality office printing
                  </span>
                </div>

                <div>
                  <strong>Copy</strong>
                  <span>
                    Efficient document reproduction
                  </span>
                </div>

                <div>
                  <strong>Scan</strong>
                  <span>
                    Digital document workflows
                  </span>
                </div>

                <div>
                  <strong>Connect</strong>
                  <span>
                    Modern office integration
                  </span>
                </div>
              </div>

              <a
                href="#products"
                className="btn btn-light"
              >
                View Bizhub Solutions
                <span>→</span>
              </a>
            </div>

            <div className="brand-visual">
              <img
                src={images.products.colour}
                alt="Konica Minolta bizhub multifunction printer"
                loading="lazy"
              />

              <div className="brand-visual-caption">
                <strong>bizhub</strong>
                <span>
                  Professional Multifunction Printing
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            SOLUTIONS
        ========================== */}
        <section
          className="solutions section"
          id="solutions"
        >
          <div className="container">
            <div className="section-heading centered">
              <div>
                <div className="section-label centered-label">
                  <span>04</span>
                  <p>BUSINESS SOLUTIONS</p>
                </div>

                <h2>
                  More than just
                  <span> printers.</span>
                </h2>
              </div>

              <p>
                Modern organizations need more than hardware.
                Our solutions combine reliable equipment,
                technical support and smarter document
                workflows.
              </p>
            </div>

            <div className="solutions-grid">
              <article className="solution-box">
                <div className="solution-image">
                  <img
                    src={images.solutions.printManagement}
                    alt="Print management solution"
                    loading="lazy"
                  />

                  <span>01</span>
                </div>

                <div className="solution-content">
                  <h3>Print Management</h3>

                  <p>
                    Improve control over printing
                    activities, equipment usage and
                    operating costs.
                  </p>

                  <a href="#contact">
                    Learn more →
                  </a>
                </div>
              </article>

              <article className="solution-box">
                <div className="solution-image">
                  <img
                    src={images.solutions.workflow}
                    alt="Document workflow solution"
                    loading="lazy"
                  />

                  <span>02</span>
                </div>

                <div className="solution-content">
                  <h3>Document Workflow</h3>

                  <p>
                    Move documents efficiently between paper
                    and digital environments.
                  </p>

                  <a href="#contact">
                    Learn more →
                  </a>
                </div>
              </article>

              <article className="solution-box">
                <div className="solution-image">
                  <img
                    src={images.solutions.managedPrint}
                    alt="Managed print services"
                    loading="lazy"
                  />

                  <span>03</span>
                </div>

                <div className="solution-content">
                  <h3>Managed Print Services</h3>

                  <p>
                    Keep your printing environment supported
                    through structured maintenance and
                    service.
                  </p>

                  <a href="#contact">
                    Learn more →
                  </a>
                </div>
              </article>

              <article className="solution-box">
                <div className="solution-image">
                  <img
                    src={images.solutions.continuity}
                    alt="Business continuity and printer support"
                    loading="lazy"
                  />

                  <span>04</span>
                </div>

                <div className="solution-content">
                  <h3>Business Continuity</h3>

                  <p>
                    Reduce printer downtime with responsive
                    technical support and maintenance.
                  </p>

                  <a href="#contact">
                    Learn more →
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =========================
            PRODUCTS
        ========================== */}
        <section
          className="products section"
          id="products"
        >
          <div className="container">
            <div className="products-header">
              <div>
                <div className="section-label">
                  <span>05</span>
                  <p>OUR PRODUCTS</p>
                </div>

                <h2>
                  Printing equipment for
                  <span> every workplace.</span>
                </h2>
              </div>

              <p>
                Tell us what your organization needs to print,
                scan or copy and our team can help you identify
                a suitable solution.
              </p>
            </div>

            <div className="product-grid">
              <article className="product-card">
                <div className="product-image">
                  <img
                    src={images.products.monochrome}
                    alt="Konica Minolta monochrome bizhub office printer"
                    loading="lazy"
                  />

                  <span>01</span>
                </div>

                <div className="product-info">
                  <span>MONOCHROME</span>

                  <h3>
                    bizhub Office Printers
                  </h3>

                  <p>
                    Efficient monochrome multifunction
                    solutions for everyday business printing.
                  </p>

                  <a href="#contact">
                    Enquire now →
                  </a>
                </div>
              </article>

              <article className="product-card">
                <div className="product-image">
                  <img
                    src={images.products.colour}
                    alt="Konica Minolta colour bizhub multifunction printer"
                    loading="lazy"
                  />

                  <span>02</span>
                </div>

                <div className="product-info">
                  <span>COLOUR</span>

                  <h3>
                    bizhub Colour Systems
                  </h3>

                  <p>
                    Professional colour multifunction
                    printers for demanding office
                    environments.
                  </p>

                  <a href="#contact">
                    Enquire now →
                  </a>
                </div>
              </article>

              <article className="product-card">
                <div className="product-image">
                  <img
                    src={images.products.document}
                    alt="Document management and digital workflow solution"
                    loading="lazy"
                  />

                  <span>03</span>
                </div>

                <div className="product-info">
                  <span>SOLUTIONS</span>

                  <h3>
                    Document Management
                  </h3>

                  <p>
                    Digital workflows and document solutions
                    designed around your organization's needs.
                  </p>

                  <a href="#contact">
                    Discuss your needs →
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =========================
            WHY MAXTECH
        ========================== */}
        <section className="why-us section">
          <div className="container why-grid">
            <div className="why-image">
              <img
                src={images.technician}
                alt="Professional technician servicing an office printer"
                loading="lazy"
              />

              <div className="why-image-caption">
                <strong>
                  Professional Technical Support
                </strong>

                <span>
                  Keeping your business moving
                </span>
              </div>
            </div>

            <div className="why-content">
              <div className="section-label">
                <span>06</span>
                <p>WHY MAXTECH</p>
              </div>

              <h2>
                Reliable technology.
                <span> Professional support.</span>
              </h2>

              <p>
                Your printer is part of your business
                infrastructure. When it stops working,
                productivity can stop with it. MAXTECH VENTURES
                is focused on keeping your document environment
                dependable.
              </p>

              <div className="benefits">
                <div className="benefit">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <h3>Technical Expertise</h3>

                    <p>
                      Professional support for Konica Minolta
                      bizhub equipment.
                    </p>
                  </div>
                </div>

                <div className="benefit">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <h3>Fast Response</h3>

                    <p>
                      Responsive service when your office
                      equipment needs attention.
                    </p>
                  </div>
                </div>

                <div className="benefit">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <h3>Business-Focused</h3>

                    <p>
                      Solutions selected around your
                      organization's actual requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-panel">
              <div className="stats-panel-heading">
                <span>MAXTECH VENTURES</span>
                <strong>
                  BUSINESS TECHNOLOGY
                </strong>
              </div>

              <div className="stat">
                <strong>01</strong>
                <span>Printer Sales</span>
              </div>

              <div className="stat">
                <strong>02</strong>
                <span>
                  Repair &amp; Maintenance
                </span>
              </div>

              <div className="stat">
                <strong>03</strong>
                <span>
                  Document Solutions
                </span>
              </div>

              <div className="stat">
                <strong>04</strong>
                <span>Technical Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            CTA
        ========================== */}
        <section className="cta">
          <div className="container cta-container">
            <div>
              <span className="cta-small">
                NEED A PRINTING SOLUTION?
              </span>

              <h2>
                Let's find the right solution
                <span> for your business.</span>
              </h2>

              <p>
                Tell us what you need and our team will help
                you identify the right printer, service or
                document management solution.
              </p>
            </div>

            <a
              href="#contact"
              className="btn btn-light"
            >
              Request a Quote
              <span>→</span>
            </a>
          </div>
        </section>

        {/* =========================
            CONTACT
        ========================== */}
        <section
          className="contact section"
          id="contact"
        >
          <div className="container contact-grid">
            <div className="contact-info">
              <div className="section-label">
                <span>07</span>
                <p>CONTACT US</p>
              </div>

              <h2>
                Let's talk about your
                <span> printing needs.</span>
              </h2>

              <p>
                Whether you need a printer, repair service,
                maintenance, consumables or a complete
                document management solution, our team is
                ready to help.
              </p>

              <div className="contact-image">
                <img
                  src={images.contact}
                  alt="MAXTECH customer support and office technology service"
                  loading="lazy"
                />
              </div>

              <div className="contact-details">
                <div className="contact-detail">
                  <div className="contact-detail-icon">
                    ☎
                  </div>

                  <div>
                    <span>Call us</span>

                    <a href="tel:+2348153279608">
                      <strong>
                        +234 8153279608
                      </strong>
                    </a>
                  </div>
                </div>

                <div className="contact-detail">
                  <div className="contact-detail-icon">
                    ✉
                  </div>

                  <div>
                    <span>Email us</span>

                    <a href="mailto:maxtech.ng@gmail.com">
                      <strong>
                        maxtech.ng@gmail.com
                      </strong>
                    </a>
                  </div>
                </div>

                <div className="contact-detail">
                  <div className="contact-detail-icon">
                    ⌖
                  </div>

                  <div>
                    <span>Location</span>

                    <strong>
                      19, Fadeyi Street, Olowora, Lagos,
                      Nigeria
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================
                REQUEST A QUOTE FORM
            ========================== */}
            <div className="contact-card">
              <div className="contact-card-heading">
                <span>
                  START A CONVERSATION
                </span>

                <h3>Request a Quote</h3>
              </div>

              {/* SUCCESS MESSAGE */}
              {formStatus.type === "success" && (
                <div
                  className="form-message form-message-success"
                  role="status"
                  aria-live="polite"
                >
                  <strong>
                    Request submitted successfully.
                  </strong>

                  <p>{formStatus.message}</p>

                  {formStatus.reference && (
                    <span>
                      Reference:{" "}
                      <strong>
                        {formStatus.reference}
                      </strong>
                    </span>
                  )}
                </div>
              )}

              {/* ERROR MESSAGE */}
              {formStatus.type === "error" && (
                <div
                  className="form-message form-message-error"
                  role="alert"
                  aria-live="assertive"
                >
                  {formStatus.message}
                </div>
              )}

              <form
                className="contact-form"
                onSubmit={handleSubmit}
                noValidate
              >
                {/* Honeypot spam protection */}
                <div
                  className="honeypot-field"
                  aria-hidden="true"
                >
                  <label htmlFor="companyWebsiteCheck">
                    Website
                  </label>

                  <input
                    id="companyWebsiteCheck"
                    name="companyWebsiteCheck"
                    type="text"
                    defaultValue=""
                    tabIndex="-1"
                    autoComplete="off"
                    aria-hidden="true"
                  />
                </div>

                {/* NAME + COMPANY */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">
                      Full Name *
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="company">
                      Company
                    </label>

                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Company name"
                      value={formData.company}
                      onChange={handleInputChange}
                      autoComplete="organization"
                    />
                  </div>
                </div>

                {/* EMAIL + PHONE */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">
                      Email Address *
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+234 815 327 9608"
                      value={formData.phone}
                      onChange={handleInputChange}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </div>
                </div>

                {/* SERVICE */}
                <div className="form-group">
                  <label htmlFor="service">
                    What do you need? *
                  </label>

                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      Select a service
                    </option>

                    <option value="printer-sales">
                      Printer Sales
                    </option>

                    <option value="printer-repair">
                      Printer Repair
                    </option>

                    <option value="maintenance">
                      Maintenance &amp; Service
                    </option>

                    <option value="document-management">
                      Document Management
                    </option>

                    <option value="parts">
                      Parts &amp; Consumables
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                {/* MESSAGE */}
                <div className="form-group">
                  <label htmlFor="message">
                    Message *
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    placeholder="Tell us what you need..."
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    minLength={10}
                    maxLength={2000}
                    aria-describedby="message-help"
                  ></textarea>

                  <div className="message-meta">
                    <small
                      id="message-help"
                      className="form-help"
                    >
                      Please provide at least 10 characters.
                    </small>

                    <small className="character-count">
                      {formData.message.length}/2000
                    </small>
                  </div>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="submit-spinner"></span>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      Send Request
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a
              href="#home"
              className="logo"
            >
              <div className="logo-mark">
                <span>M</span>
              </div>

              <div className="logo-text">
                <strong>MAXTECH</strong>
                <span>VENTURES</span>
              </div>
            </a>

            <p>
              Professional printer sales, repairs,
              maintenance and document management solutions
              for modern businesses.
            </p>
          </div>

          <div className="footer-column">
            <h4>Company</h4>

            <a href="#about">About Us</a>
            <a href="#services">Services</a>
            <a href="#solutions">Solutions</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-column">
            <h4>Services</h4>

            <a href="#services">
              Printer Sales
            </a>

            <a href="#services">
              Printer Repairs
            </a>

            <a href="#services">
              Maintenance
            </a>

            <a href="#services">
              Document Management
            </a>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>

            <a href="tel:+2348153279608">
              +234 8153279608
            </a>

            <a href="mailto:maxtech.ng@gmail.com">
              maxtech.ng@gmail.com
            </a>

            <span>
              19, Fadeyi Street, Olowora, Lagos
            </span>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>
            © {new Date().getFullYear()} MAXTECH VENTURES.
            All rights reserved.
          </p>

          <div>
            <a href="#home">Privacy</a>
            <a href="#home">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
