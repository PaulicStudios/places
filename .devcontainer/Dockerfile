FROM node:22

# Install basic development tools
RUN apt update && apt install -y less man-db sudo

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash

# Add Foundry to PATH
ENV PATH="/root/.foundry/bin:${PATH}"

RUN foundryup