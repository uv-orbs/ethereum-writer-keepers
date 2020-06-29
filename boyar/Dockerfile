FROM local/ethereum-writer

COPY ./service ./
COPY ./healthcheck ./
COPY ./healthcheck.js ./
HEALTHCHECK CMD /opt/orbs/healthcheck
